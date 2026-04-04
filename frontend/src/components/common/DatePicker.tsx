// 커스텀 달력 컴포넌트
import { useState, useEffect, useRef } from 'react'

interface DatePickerProps {
  value: string // YYYY-MM-DD 형식
  onChange: (date: string) => void
  placeholder?: string
}

const DatePicker = ({ value, onChange, placeholder = '날짜를 선택하세요' }: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const containerRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 날짜 포맷팅
  const formatDateToKorean = (dateStr: string) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${year}년 ${month}월 ${day}일`
  }

  // 해당 월의 날짜들 생성
  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: Array<{ date: number; isCurrentMonth: boolean; fullDate: string }> = []

    // 이전 달 날짜들
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      days.push({
        date: daysInPrevMonth - i,
        isCurrentMonth: false,
        fullDate: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`
      })
    }

    // 현재 달 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      })
    }

    // 다음 달 날짜들 (6주 채우기)
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      })
    }

    return days
  }

  const days = getDaysInMonth(currentYear, currentMonth)
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

  const handleDateClick = (fullDate: string) => {
    onChange(fullDate)
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const isToday = (fullDate: string) => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return fullDate === todayStr
  }

  const isSelected = (fullDate: string) => {
    return value === fullDate
  }

  return (
    <div ref={containerRef} className="relative">
      {/* 입력 필드 */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer flex items-center justify-between hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
      >
        <span className={value ? '' : 'text-gray-400 dark:text-gray-500'}>
          {value ? formatDateToKorean(value) : placeholder}
        </span>
        <span className="material-icons-outlined text-gray-500">calendar_today</span>
      </div>

      {/* 달력 드롭다운 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 max-w-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="material-icons-outlined text-gray-600 dark:text-gray-400 text-xl">chevron_left</span>
            </button>
            
            <div className="text-base font-bold text-gray-900 dark:text-white">
              {currentYear}년 {monthNames[currentMonth]}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="material-icons-outlined text-gray-600 dark:text-gray-400 text-xl">chevron_right</span>
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`text-center text-xs font-semibold py-1.5 ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, index) => {
              const today = isToday(day.fullDate)
              const selected = isSelected(day.fullDate)
              const isSunday = index % 7 === 0
              const isSaturday = index % 7 === 6

              return (
                <button
                  key={`${day.fullDate}-${index}`}
                  type="button"
                  onClick={() => handleDateClick(day.fullDate)}
                  className={`
                    relative p-1.5 text-xs rounded-lg transition-all
                    ${!day.isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                    ${day.isCurrentMonth && isSunday ? 'text-red-500' : ''}
                    ${day.isCurrentMonth && isSaturday ? 'text-blue-500' : ''}
                    ${day.isCurrentMonth && !isSunday && !isSaturday ? 'text-gray-900 dark:text-white' : ''}
                    ${selected ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg scale-105' : ''}
                    ${!selected && day.isCurrentMonth ? 'hover:bg-purple-100 dark:hover:bg-purple-900/30' : ''}
                    ${today && !selected ? 'ring-2 ring-purple-500 font-bold' : ''}
                  `}
                >
                  {day.date}
                </button>
              )
            })}
          </div>

          {/* 오늘 버튼 */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                handleDateClick(todayStr)
              }}
              className="w-full py-2 px-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all"
            >
              오늘
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker
