"use client"

import { useState } from "react"
import PropertyDetails from "@/components/property-details"

export default function PropertyDetailsPage() {
  const [showBorrowingPowerModal, setShowBorrowingPowerModal] = useState(false)
  return <PropertyDetails setShowBorrowingPowerModal={setShowBorrowingPowerModal} />
} 