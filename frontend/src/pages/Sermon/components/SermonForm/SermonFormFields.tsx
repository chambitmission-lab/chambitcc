// 설교 폼 필드 컴포넌트
import DatePicker from '../../../../components/common/DatePicker'
import type { SermonFormData } from './types'

interface SermonFormFieldsProps {
  formData: SermonFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export const SermonFormFields = ({ formData, onChange }: SermonFormFieldsProps) => {
  const handleDateChange = (date: string) => {
    // 가짜 이벤트 객체 생성
    const fakeEvent = {
      target: {
        name: 'sermon_date',
        value: date
      }
    } as React.ChangeEvent<HTMLInputElement>
    
    onChange(fakeEvent)
  }

  return (
    <div className="space-y-4">
      {/* 제목 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          제목 *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={onChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="설교 제목을 입력하세요"
          required
        />
      </div>

      {/* 목사님 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          목사님 *
        </label>
        <input
          type="text"
          name="pastor"
          value={formData.pastor}
          onChange={onChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="목사님 성함을 입력하세요"
          required
        />
      </div>

      {/* 성경 구절 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          성경 구절 *
        </label>
        <input
          type="text"
          name="bible_verse"
          value={formData.bible_verse}
          onChange={onChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="예: 요한복음 3:16"
          required
        />
      </div>

      {/* 설교 날짜 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          설교 날짜 *
        </label>
        <DatePicker
          value={formData.sermon_date}
          onChange={handleDateChange}
          placeholder="날짜를 선택하세요"
        />
      </div>

      {/* 설교 내용 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          설교 내용 *
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={onChange}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          placeholder="설교 내용을 입력하세요"
          required
        />
      </div>
    </div>
  )
}
