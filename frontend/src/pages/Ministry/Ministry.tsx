import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import './Ministry.css'

interface Column {
  id: number
  title: string
  author: string
  role: string
  date: string
  content: string
  image?: string
}

// 중요한 문구를 하이라이트하는 함수
const renderHighlightedText = (text: string) => {
  // [[텍스트]] 형식을 찾아서 빛나는 효과 적용
  const parts = text.split(/(\[\[.*?\]\])/g)
  
  return parts.map((part, index) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const highlightedText = part.slice(2, -2)
      return (
        <span
          key={index}
          className="font-bold text-purple-600 dark:text-purple-400"
          style={{
            textShadow: '0 0 15px rgba(168, 85, 247, 0.8), 0 0 25px rgba(168, 85, 247, 0.5)',
          }}
        >
          {highlightedText}
        </span>
      )
    }
    return part
  })
}

const Ministry = () => {
  const { language } = useLanguage()
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null)

  const columns: Column[] = [
    {
      id: 1,
      title: language === 'ko' ? '함께 지어져 가는 교회 공간' : 'Building Church Space Together',
      author: language === 'ko' ? '안동철' : 'Dong-Chul Ahn',
      role: language === 'ko' ? '담임목사' : 'Senior Pastor',
      date: '2026.02',
      content: language === 'ko' 
        ? `교회 건물은 다수한 '시설'이나 '건물'이 아닙니다. 비바람을 피하는 장소이기 이전에, [[예배와 기도, 만남과 회복이 이루어지는 거룩한 공간]]입니다. 또한 교회 건물은 사유재가 아니라 [[공공재적인 성격을 지닌 공간]]입니다. 누구 한 사람의 뜻대로 위해 존재하는 것이 아니라, 하나님께서 말기신 공동체 전체를 위해 사용되어야 할 공간이기 때문입니다.

그래서 교회 건물을 사용할 때 우리는 항상 이 질문을 스스로에게 던져야 합니다. [["건물을 사용할 때 나만 편리한가? 아니면 공동체의 유익을 위한 것인가?"]] 하는 질문입니다. 우리 교회는 건물을 사용할 때 사무실에 비치된 '교회 공간 사용신청서'를 작성하고 허락을 받은 후 사용하도록 하고 있습니다. 이는 절차를 복잡하게 하려는 규칙이 아니라, 여러 공동체와 세대가 같은 공간을 사용하는 기운데 서로간 충돌을 막고 질서를 세우기 위한 최소한의 약속입니다. [[약속이 있을 때 공동체는 더 자유로워질 수 있습니다.]]

그런 관점에서 교회 공동체 내 소실을 알릴 때에도 교회 허락을 받아야 하며, 게시적으로 출력하여 아무 곳이나 부착하는 일은 삼가야 합니다. 이달의 좋은 내용이라 하더라도, 방식이 공동체의 질서를 해친다면 그 또한 호려질 수밖에 없습니다. 교회가 정한 공식 양식을 사용하고, 정해진 게시 장소에 부착하는 것 역시 [[함께 사용하고, 함께 지켜가는 공간에 대한 존중의 표현]]입니다.

시도 바울은 에베소서 2장 22절에서 교회를 이렇게 말합니다. [["너희도 성령 안에서 하나님이 거하실 처소가 되기 위하여 예수 안에서 함께 지어져 가느니라."]] 교회는 흔적가가 아니라 '온자가' 함께 만들어가는 것입니다. 교회는 '누군가가 홀로 완성하는 것'이 아니라, [[서로 다른 돌들이 맞물리며 지어가는 살아 있는 공동체]]입니다. 공간을 사용하는 태도 역시 이 신앙고백과 분리될 수 없습니다.

교회 공간 사용에 있어 또 하나 기억해야 할 부분이 있습니다. 사랑한 후에는 [[다음 사용자를 위해 깨끗하게 정리하는 점]]입니다. 의자를 제자리에 두고, 쓰레기를 치우며, 전기 제품 등을 점검하는 일은 작은 보이지만 실은 상당히 중요한 일이 아닙니다. 현재 교회의 전기와 냉난방 사용이 많이 지출되고 있는 현실 속에서, [[절약은 서비스가 아니라 책임]]이며, 교회를 향한 우리의 태도를 드러내는 신앙의 문제이기도 합니다.

하나님은 그분의 백성이 모이는 교회 공간을 통해 우리를 만나 주십니다. 그렇기에 우리는 [[이 공간을 소중히 사용하고, 조심스럽게 관리하며, 기쁨으로 함께 지켜가야]] 합니다. 서로를 배려하는 작은 실천 하나하나가 교회를 세웁니다. [[함께 사용하고, 함께 먹지고, 함께 지어가는 공동체]]. 그 아름다운 교회의 모습이 우리의 공간 사용 속에서도 드러나기를 소망합니다.`
        : `The church building is not just a 'facility' or 'building'. Before being a shelter from wind and rain, it is [[a holy space where worship, prayer, meetings, and restoration take place]]. Furthermore, the church building is not private property but [[has the character of a public space]]. It exists not for the will of one person, but as a space that should be used for the entire community entrusted by God.

Therefore, when using the church building, we must always ask ourselves this question: [["When using the building, is it only convenient for me? Or is it for the benefit of the community?"]] Our church requires filling out a 'Church Space Usage Application Form' available at the office and receiving permission before use. This is not a rule to complicate procedures, but a minimum agreement to prevent conflicts and establish order as various communities and generations use the same space. [[When there are agreements, the community can become freer.]]

From this perspective, even when announcing news within the church community, church permission must be obtained, and posting anywhere should be avoided. Even if the content is good, if the method disrupts the community's order, it can also be confused. Using the official format established by the church and posting in designated areas is also [[an expression of respect for a space we use together and protect together]].

The Apostle Paul says in Ephesians 2:22: [["In him you too are being built together to become a dwelling in which God lives by his Spirit."]] The church is not built by 'someone' but by 'everyone' together. The church is not 'completed alone by someone', but is [[a living community built as different stones fit together]]. The attitude of using space cannot be separated from this confession of faith.

There is one more thing to remember when using church space. After use, [[clean up for the next user]]. Putting chairs back in place, cleaning up trash, and checking electrical appliances may seem small but are actually quite important. In the current reality where church electricity and heating/cooling usage is high, [[conservation is not a service but a responsibility]], and it is also a matter of faith that reveals our attitude toward the church.

God meets us through the church space where His people gather. Therefore, we must [[use this space carefully, manage it cautiously, and joyfully protect it together]]. Each small act of consideration for others builds the church. [[A community that uses together, eats together, and builds together]]. I hope that this beautiful image of the church will also be revealed in our use of space.`
    }
  ]

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        {/* Header */}
        <div className="sticky top-14 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>✍️</span>
              <span>{language === 'ko' ? '목양칼럼' : 'Pastoral Column'}</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {language === 'ko' ? '담임목사의 목회 이야기' : "Pastor's Ministry Stories"}
            </p>
          </div>
        </div>

        {/* Column List */}
        <div className="p-4 space-y-4">
          {columns.map((column) => (
            <article
              key={column.id}
              className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm border border-border-light dark:border-border-dark hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedColumn(column)}
            >
              {/* Author Info */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {column.author[0]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {column.author} {column.role}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {column.date}
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <div className="px-4 pb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {column.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                  {column.content}
                </p>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <button className="flex items-center gap-1 text-sm hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <span className="material-icons-outlined text-xl">favorite_border</span>
                  <span>{language === 'ko' ? '좋아요' : 'Like'}</span>
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <span className="material-icons-outlined text-xl">chat_bubble_outline</span>
                  <span>{language === 'ko' ? '댓글' : 'Comment'}</span>
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-purple-600 dark:hover:text-purple-400 transition-colors ml-auto">
                  <span className="material-icons-outlined text-xl">bookmark_border</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Detail Modal */}
        {selectedColumn && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedColumn(null)}
          >
            <div 
              className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {selectedColumn.author[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {selectedColumn.author} {selectedColumn.role}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedColumn.date}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedColumn(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <span className="material-icons-outlined text-2xl">close</span>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {selectedColumn.title}
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {selectedColumn.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {renderHighlightedText(paragraph)}
                    </p>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="sticky bottom-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-sm border-t border-border-light dark:border-border-dark p-4 flex items-center gap-4">
                <button className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <span className="material-icons-outlined text-2xl">favorite_border</span>
                  <span className="text-sm font-medium">{language === 'ko' ? '좋아요' : 'Like'}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <span className="material-icons-outlined text-2xl">chat_bubble_outline</span>
                  <span className="text-sm font-medium">{language === 'ko' ? '댓글' : 'Comment'}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors ml-auto">
                  <span className="material-icons-outlined text-2xl">share</span>
                  <span className="text-sm font-medium">{language === 'ko' ? '공유' : 'Share'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Ministry