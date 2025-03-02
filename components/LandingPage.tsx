"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Clock, ArrowRight, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Mock data for recent searches and suggested properties
const RECENT_SEARCHES = [
  "72 McArthur Road, Ivanhoe VIC 3079",
  "24 Smith Street, Brunswick VIC 3056",
  "15 Wilson Road, Camberwell VIC 3124",
]

const SUGGESTED_PROPERTIES = [
  {
    address: "72 McArthur Road, Ivanhoe VIC 3079",
    price: "$1.96M",
    beds: 4,
    baths: 3,
    parking: 2,
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-8tgZj2IKhGZmOMqEtl4kCqnqWZFcue.png"
  },
  {
    address: "18 Park Street, Carlton VIC 3053",
    price: "$1.45M",
    beds: 3,
    baths: 2,
    parking: 1,
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    address: "5 Ocean View Road, Brighton VIC 3186",
    price: "$2.85M",
    beds: 5,
    baths: 4,
    parking: 3,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  }
]

export default function LandingPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(RECENT_SEARCHES)

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (searchQuery.trim()) {
      // Add to recent searches if not already there
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches([searchQuery, ...recentSearches.slice(0, 4)])
      }
      
      // Navigate to property details page
      // For simplicity, we'll just navigate to our property details page for any query
      router.push("/property-details")
    }
  }

  // Handle selecting a property from suggestions or recent searches
  const handleSelectProperty = (address: string) => {
    setSearchQuery(address)
    
    // Add to recent searches if not already there
    if (!recentSearches.includes(address)) {
      setRecentSearches([address, ...recentSearches.filter(s => s !== address)])
    }
    
    // Navigate to property details page
    router.push("/property-details")
  }
  
  // Clear a recent search
  const clearRecentSearch = (e: React.MouseEvent, search: string) => {
    e.stopPropagation()
    setRecentSearches(recentSearches.filter(s => s !== search))
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div 
        className="w-full h-[60vh] bg-cover bg-center relative"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1571055107559-3e67626fa8be?q=80&w=2069&auto=format&fit=crop')",
          backgroundPosition: "center 35%"
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        
        <div className="absolute inset-0 flex items-center justify-center flex-col px-4">
          <h1 className="text-white font-bold text-4xl md:text-5xl mb-6 text-center">
            Find your perfect property
          </h1>
          <p className="text-white text-xl md:text-2xl mb-8 text-center max-w-4xl">
            Search for homes with confidence using our comprehensive property data and affordability tools
          </p>
        </div>
      </div>
      
      {/* Search Section - Positioned above the middle */}
      <div className="w-full max-w-4xl mx-auto px-4 -mt-14 mb-16 relative z-10">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by suburb, address, or postcode"
                  className="w-full pl-12 pr-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a7d7d]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowRecentSearches(true)}
                  onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                />
                <Button 
                  type="submit" 
                  className="absolute right-2 top-2 bg-[#2a7d7d] hover:bg-[#236363]"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Recent Searches Dropdown */}
              {showRecentSearches && recentSearches.length > 0 && (
                <div className="absolute w-full mt-1 rounded-lg border bg-white shadow-lg z-20">
                  <div className="p-2 border-b">
                    <h3 className="text-sm font-medium text-gray-700">Recent Searches</h3>
                  </div>
                  <ul>
                    {recentSearches.map((search, index) => (
                      <li 
                        key={index}
                        className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectProperty(search)}
                      >
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{search}</span>
                        </div>
                        <button 
                          onClick={(e) => clearRecentSearch(e, search)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Suggested Properties Section */}
      <div className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Suggested Properties</h2>
          <Button variant="outline" className="text-[#2a7d7d]">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUGGESTED_PROPERTIES.map((property, index) => (
            <Card 
              key={index} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
              onClick={() => handleSelectProperty(property.address)}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src={property.image} 
                  alt={property.address}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2 truncate">{property.address}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-[#2a7d7d]">{property.price}</span>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <span>{property.beds} Bed</span>
                    <span>{property.baths} Bath</span>
                    <span>{property.parking} Car</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Make informed property decisions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-[#2a7d7d] h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Find Properties</h3>
              <p className="text-gray-600">Search thousands of listings to find your perfect property</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-[#2a7d7d] h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M2 20h.01m4 0h.01m4 0h.01m4 0h.01m4 0h.01M14 10h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h4M12 4v6"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Check Affordability</h3>
              <p className="text-gray-600">Use our tools to calculate what you can afford</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-[#2a7d7d] h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M16 6l4 14"></path>
                  <path d="M12 6v14"></path>
                  <path d="M8 8v12"></path>
                  <path d="M4 4v16"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Market Insights</h3>
              <p className="text-gray-600">Get detailed insights on property values and trends</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Property Affordability</h3>
              <p className="text-gray-400">Making property decisions simpler and more informed with our comprehensive tools.</p>
            </div>
            
            <div>
              <h4 className="text-md font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Search</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Calculators</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Market Trends</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Guides</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-bold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">info@propertyaffordability.com</li>
                <li className="text-gray-400">1300 123 456</li>
                <li className="text-gray-400">Melbourne, Australia</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Property Affordability. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 