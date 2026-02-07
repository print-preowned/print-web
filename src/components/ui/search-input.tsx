"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface SearchInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type"> {
  wrapperClassName?: string
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, wrapperClassName, ...props }, ref) => {
    return (
      <div className={cn("relative", wrapperClassName)}>
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4  text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={ref}
          type="text"
          className={cn("pl-10", className)}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
