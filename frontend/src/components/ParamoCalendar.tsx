import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, AlertCircle, Check } from 'lucide-react';

export interface AvailableDateInfo {
  date: string; // YYYY-MM-DD
  display: string;
  slots: number;
}

interface ParamoCalendarProps {
  availableDates: AvailableDateInfo[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateInfo: AvailableDateInfo) => void;
}

export const ParamoCalendar: React.FC<ParamoCalendarProps> = ({
  availableDates,
  selectedDate,
  onSelectDate
}) => {
  // Calendar month state (defaults to December 2025 where demo trail dates live)
  const [currentYear, setCurrentYear] = useState(2025);
  const [currentMonth, setCurrentMonth] = useState(11); // 0-indexed: 11 = Diciembre

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Days in month calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0

  return (
    <div className="bg-white rounded-3xl border border-[#e5dfd2] p-6 shadow-sm flex flex-col gap-5 w-full">
      
      {/* Calendar Header with Month Selector */}
      <div className="flex items-center justify-between border-b border-[#eae5da] pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7ea56a] block">
            Calendario de Cupos Oficiales PNN
          </span>
          <h4 className="font-['Outfit:Bold'] font-bold text-xl text-[#13201a]">
            {monthNames[currentMonth]} {currentYear}
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-[#f5f1e7] hover:bg-[#eae5da] text-[#13201a] transition-colors cursor-pointer"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-[#f5f1e7] hover:bg-[#eae5da] text-[#13201a] transition-colors cursor-pointer"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#5e6c64] uppercase">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty slots before first day */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-14 sm:h-16 rounded-2xl bg-transparent" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const formattedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          
          const availableInfo = availableDates.find((d) => d.date === formattedDateStr);
          const isSelected = selectedDate === formattedDateStr;

          if (availableInfo) {
            return (
              <button
                type="button"
                key={formattedDateStr}
                onClick={() => onSelectDate(availableInfo)}
                className={`h-14 sm:h-16 rounded-2xl p-1.5 flex flex-col justify-between items-center transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-[#13201a] text-white shadow-lg scale-105 border-2 border-[#dceb6b]'
                    : 'bg-[#f5f9e8] border border-[#dceb6b] hover:bg-[#dceb6b]/30 text-[#13201a]'
                }`}
              >
                <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-[#13201a]'}`}>
                  {dayNum}
                </span>

                <div className="flex flex-col items-center">
                  <span className={`text-[9px] font-extrabold uppercase tracking-tight px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-[#dceb6b] text-[#13201a]' : 'bg-white text-[#2e7d32] border border-[#a5d6a7]'
                  }`}>
                    {availableInfo.slots} cupos
                  </span>
                </div>
              </button>
            );
          }

          // Inactive day (no slots or past)
          return (
            <div
              key={formattedDateStr}
              className="h-14 sm:h-16 rounded-2xl p-1.5 flex flex-col justify-center items-center text-[#b8b3a7] bg-[#faf8f3] border border-transparent select-none"
            >
              <span className="text-xs font-medium">{dayNum}</span>
              <span className="text-[9px] opacity-40">Lleno</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="border-t border-[#eae5da] pt-3 flex flex-wrap items-center justify-between text-xs text-[#5e6c64] gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-md bg-[#f5f9e8] border border-[#dceb6b]" />
            <span className="text-[11px]">Cupos Disponibles PNN</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-md bg-[#13201a]" />
            <span className="text-[11px] font-bold text-[#13201a]">Seleccionado</span>
          </div>
        </div>

        <span className="text-[11px] text-[#7ea56a] font-bold flex items-center gap-1">
          <Sparkles className="size-3" />
          <span>Aforo controlado ecológicamente</span>
        </span>
      </div>

    </div>
  );
};

export default ParamoCalendar;
