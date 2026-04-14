"use client"

import { useState } from "react"
import { PlusSquare } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { AddResourceForm } from "./add-resource-form"

export function AddResourceDialog({ stacqId, availableSections }: { stacqId: string, availableSections: string[] }) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="flex-1 sm:flex-none inline-flex items-center justify-center whitespace-nowrap text-xs h-10 bg-primary hover:opacity-90 text-primary-foreground rounded-full px-4 sm:px-8 shadow-sm font-bold transition-all active:scale-95 border-none outline-none">
                <PlusSquare className="w-4 h-4 mr-2" /> Add Resource
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-2xl p-0 border-none bg-transparent shadow-none rounded-3xl overflow-hidden">
                <div className="max-h-[85vh] overflow-y-auto custom-scrollbar bg-white rounded-3xl mt-4 sm:mt-0">
                    <AddResourceForm 
                        stacqId={stacqId} 
                        availableSections={availableSections} 
                        onSuccess={() => setOpen(false)}
                    />
                </div>
            </DialogContent>

        </Dialog>
    )
}
