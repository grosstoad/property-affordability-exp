"use client"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"

export default function PropertySearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState("")
  const [showResults, setShowResults] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Updated dummy address data
  const dummyAddresses = [
    "72 McArthur Road, Ivanhoe VIC 3079",
    "40 Scotchmer Street, Fitzroy North VIC 3068",
    "6 Alverna Close, Greensborough VIC 3088",
    "12 Smith Street, Richmond VIC 3121",
    "25 Jones Road, Bentleigh East VIC 3165",
    "8 Williams Avenue, Malvern VIC 3144",
  ]

  // Filter addresses based on search term
  const filteredAddresses = dummyAddresses.filter((address) => 
    address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleAddressSelect = (address: string) => {
    setSelectedAddress(address)
    setSearchTerm(address)
    setShowDropdown(false)
    setShowResults(true)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-16 px-4">
      {!showResults ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#2a7d7d] mb-2">Check your affordability</h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Check the loan you need for the property you want and whether you can afford it
            </p>
          </div>

          <div className="w-full max-w-2xl relative" ref={dropdownRef}>
            <label htmlFor="property-search" className="block text-left text-xl font-medium text-gray-700 mb-2">
              Property address
            </label>
            <div className="relative">
              <input
                id="property-search"
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowDropdown(e.target.value.length > 0)
                }}
                onFocus={() => {
                  if (searchTerm.length > 0) setShowDropdown(true)
                }}
                className="w-full py-4 px-4 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2a7d7d] focus:border-[#2a7d7d] shadow-sm text-lg"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="h-6 w-6 text-[#2a7d7d]" />
              </div>
            </div>

            {showDropdown && filteredAddresses.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                <ul>
                  {filteredAddresses.map((address, index) => (
                    <li
                      key={index}
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleAddressSelect(address)}
                    >
                      {address}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8 text-gray-500">
            <h2 className="font-medium mb-2">Recent Searches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dummyAddresses.slice(0, 2).map((address, index) => (
                <div
                  key={index}
                  className="bg-gray-100 p-3 rounded-lg cursor-pointer hover:bg-gray-200"
                  onClick={() => handleAddressSelect(address)}
                >
                  {address}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-[#2a7d7d] mb-4">Property Details</h2>
          <p className="text-lg mb-6">{selectedAddress}</p>
          <div className="p-6 bg-gray-100 rounded-lg mb-6">
            <p className="text-center text-gray-600">
              Property details and affordability information would be displayed here.
            </p>
          </div>
          <button
            className="bg-[#2a7d7d] text-white px-6 py-3 rounded-lg hover:bg-[#1d5c5c] transition-colors"
            onClick={() => setShowResults(false)}
          >
            Search Another Property
          </button>
        </div>
      )}

      <div className="mt-auto py-6">
        <div className="flex items-center justify-center">
          <img src="/placeholder.svg?height=40&width=180" alt="Mortgage Choice Freedom Logo" className="h-10" />
        </div>
      </div>
    </div>
  )
} 