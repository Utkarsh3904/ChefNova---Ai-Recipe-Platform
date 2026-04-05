"use client"

import React, { useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button';
import PricingSection from './PricingSection';

const PricingModal = ({ subscriptionTier = "free", children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const canOpen = subscriptionTier === "free";

  return (
    <div>
       
    <Dialog isOpen={isOpen} onOpenChange={canOpen ? setIsOpen : undefined }>
      <form>
        <DialogTrigger asChild >
            {children}
        </DialogTrigger>
        <DialogContent className="p-8 pt-4 sm:max-w-4xl">
          
          <DialogTitle/>

          <PricingSection/>

        </DialogContent>
      </form>
    </Dialog>

    </div>
  )
}

export default PricingModal
