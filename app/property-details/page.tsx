"use client"

import PropertyDetails from "@/property-details"
import { useState } from "react"

export default function PropertyDetailsPage() {
  const [showBorrowingPowerModal, setShowBorrowingPowerModal] = useState(false)
  
  return <PropertyDetails setShowBorrowingPowerModal={setShowBorrowingPowerModal} />
} 