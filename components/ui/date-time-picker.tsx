"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [time, setTime] = React.useState<string>(
    date ? format(date, "HH:mm") : "09:00"
  )

  // Sync internal state if prop changes centrally
  React.useEffect(() => {
    setSelectedDate(date)
    if (date) {
        setTime(format(date, "HH:mm"))
    }
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
        // Preserve existing time or use current time state
        const [hours, minutes] = time.split(":").map(Number)
        newDate.setHours(hours)
        newDate.setMinutes(minutes)
        setDate(newDate)
    } else {
        setDate(undefined)
    }
    setSelectedDate(newDate)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    
    if (selectedDate) {
        const [hours, minutes] = newTime.split(":").map(Number)
        const newDate = new Date(selectedDate)
        newDate.setHours(hours)
        newDate.setMinutes(minutes)
        setDate(newDate)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy HH:mm") : <span>Chọn ngày giờ</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="time-input" className="text-sm font-medium">Giờ:</Label>
                <Input 
                    id="time-input"
                    type="time" 
                    value={time} 
                    onChange={handleTimeChange}
                    className="h-8 w-full"
                />
            </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
