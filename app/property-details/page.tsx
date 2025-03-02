"use client"

import { useState } from "react"
import PropertyDetails from "@/components/property-details"
import { BorrowingPowerModal } from "@/components/BorrowingPowerModal"

export default function PropertyDetailsPage() {
  const [showBorrowingPowerModal, setShowBorrowingPowerModal] = useState(false)

  return (
    <>
      <PropertyDetails setShowBorrowingPowerModal={setShowBorrowingPowerModal} />
      <BorrowingPowerModal
        isOpen={showBorrowingPowerModal}
        onClose={() => setShowBorrowingPowerModal(false)}
        propertyValue={0}
        deposit={0}
        state="VIC"
        isFirstHomeBuyer={false}
        onCalculate={(results) => {
          console.log('Calculation results:', results)
          setShowBorrowingPowerModal(false)
        }}
      />
    </>
  )
} 