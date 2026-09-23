// 편집기 안의 사진 블록 — 읽기 화면과 같은 모습에, 캡션 입력칸과 삭제 버튼만 더한다.

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useLanguage } from '../../contexts/LanguageContext'

const ColumnImageView = ({ node, updateAttributes, deleteNode, selected }: NodeViewProps) => {
  const src = String(node.attrs.src || '')
  const caption = String(node.attrs.caption || '')
  const ko = useLanguage().language === 'ko'

  return (
    <NodeViewWrapper as="figure" className="ce-figure group" data-drag-handle>
      <div className={`relative rounded-2xl overflow-hidden transition-shadow ${selected ? 'ring-[3px] ring-[var(--brand)]' : ''}`}>
        <img src={src} alt={caption} className="w-full object-cover" draggable={false} />
        <button
          type="button"
          onClick={deleteNode}
          contentEditable={false}
          className={`absolute top-3 right-3 h-10 px-3.5 rounded-full bg-black/60 text-white text-[14px] font-semibold backdrop-blur-sm ${selected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 focus:opacity-100 transition-opacity`}
        >
          {ko ? '사진 빼기' : 'Remove'}
        </button>
      </div>
      <input
        type="text"
        value={caption}
        onChange={(e) => updateAttributes({ caption: e.target.value })}
        placeholder={ko ? '사진 설명을 적어 주세요 (선택)' : 'Add a caption (optional)'}
        className="ce-figcaption-input"
      />
    </NodeViewWrapper>
  )
}

export default ColumnImageView
