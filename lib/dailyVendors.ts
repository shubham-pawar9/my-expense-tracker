import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DailyVendor } from '@/types'
import { format, isAfter, parseISO } from 'date-fns'

const DAILY_SUPPLY_CATEGORY = 'Daily Supply'
const DAILY_ENTRY_STATUS = 'Delivered'
const LEGACY_USER_ID = 'USER_ID'

const getVendorAmount = (vendor: DailyVendor) => {
  if (vendor.vendorType === 'Milk') {
    const price = vendor.pricePerLiter || 0
    const quantity = vendor.dailyQuantity || 0
    return Number((price * quantity).toFixed(2))
  }

  if (vendor.vendorType === 'Newspaper') {
    return Number((vendor.pricePerDay || 0).toFixed(2))
  }

  return 0
}

const getVendorQuantity = (vendor: DailyVendor) => {
  if (vendor.vendorType === 'Milk') {
    return vendor.dailyQuantity || 0
  }

  return 1
}

export const ensureDailyVendorEntries = async (userId: string, targetDate: Date = new Date()) => {
  const date = format(targetDate, 'yyyy-MM-dd')

  const userVendorsSnapshot = await getDocs(
    query(
      collection(db, 'dailyVendors'),
      where('userId', '==', userId),
      where('isActive', '==', true),
    ),
  )

  const userVendors = userVendorsSnapshot.docs.map((vendorDoc) => ({
    ...(vendorDoc.data() as DailyVendor),
    id: vendorDoc.id,
    userId,
  }))

  const legacyVendorsSnapshot = await getDocs(
    query(
      collection(db, 'dailyVendors'),
      where('userId', '==', LEGACY_USER_ID),
      where('isActive', '==', true),
    ),
  )

  const createdVendors = await Promise.all(
    legacyVendorsSnapshot.docs
      .map((vendorDoc) => vendorDoc.data() as DailyVendor)
      .filter(
        (legacyVendor) =>
          !userVendors.some(
            (userVendor) =>
              userVendor.vendorName === legacyVendor.vendorName &&
              userVendor.vendorType === legacyVendor.vendorType &&
              userVendor.startDate === legacyVendor.startDate,
          ),
      )
      .map(async (legacyVendor) => {
        const userVendorRef = doc(collection(db, 'dailyVendors'))
        const userVendor: DailyVendor = {
          ...legacyVendor,
          userId,
          updatedAt: new Date(),
          createdAt: new Date(),
        }

        await setDoc(userVendorRef, userVendor)

        return {
          ...userVendor,
          id: userVendorRef.id,
        }
      }),
  )

  const activeVendors = [...userVendors, ...createdVendors].map((vendor) => ({
    ...vendor,
    userId,
  }))

  for (const vendor of activeVendors) {
    if (isAfter(parseISO(vendor.startDate), parseISO(date))) {
      continue
    }

    const existingEntrySnapshot = await getDocs(
      query(
        collection(db, 'vendorDailyEntries'),
        where('userId', '==', userId),
        where('vendorId', '==', vendor.id),
        where('date', '==', date),
      ),
    )

    if (existingEntrySnapshot.empty) {
      const quantity = getVendorQuantity(vendor)
      const amount = getVendorAmount(vendor)

      const entryRef = doc(collection(db, 'vendorDailyEntries'))
      await setDoc(entryRef, {
        userId,
        vendorId: vendor.id,
        vendorName: vendor.vendorName,
        vendorType: vendor.vendorType,
        date,
        status: DAILY_ENTRY_STATUS,
        quantity,
        amount,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const existingExpenseSnapshot = await getDocs(
        query(
          collection(db, 'expenses'),
          where('userId', '==', userId),
          where('date', '==', date),
          where('description', '==', `${vendor.vendorType} - ${vendor.vendorName}`),
          where('category', '==', DAILY_SUPPLY_CATEGORY),
        ),
      )

      if (existingExpenseSnapshot.empty) {
        await addDoc(collection(db, 'expenses'), {
          userId,
          amount,
          category: DAILY_SUPPLY_CATEGORY,
          description: `${vendor.vendorType} - ${vendor.vendorName}`,
          date,
          createdAt: new Date(),
          isFixed: false,
          vendorId: vendor.id,
          vendorEntryId: entryRef.id,
        })
      }
    }
  }
}
