"use client"

import { createContext, useContext, useState } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

const DrawerContext = createContext({
    open: false,
    setOpen: (open: boolean) => {},
})

export function DrawerProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)

    return <DrawerContext.Provider value={{ open, setOpen }}>
        {children}
        <Drawer direction={"right"} open={open}>
      <DrawerContent>
        {/* <DrawerTrigger>{drawerTrigger(setOpen)}</DrawerTrigger> */}
        <DrawerHeader className="gap-1">
          <DrawerTitle>header</DrawerTitle>
          {/* {description && (
            <DrawerDescription>{description ?? "Describe"}</DrawerDescription>
          )} */}
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {children}
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline" onClick={() => setOpen(false)}>Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
    </DrawerContext.Provider>
}

export function useDrawer() {
    return useContext(DrawerContext)
}