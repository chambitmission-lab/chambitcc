import { useState } from 'react'
import { isAdmin } from '../../../utils/auth'
import { showToast } from '../../../utils/toast'
import {
  useDigitalBulletin,
  useReplaceDigitalBulletin,
} from '../../../hooks/useDigitalBulletin'
import { EditableField, AddItemButton, RemoveItemButton } from '../../../components/EditableField'
import type {
  AnnouncementItem,
  BulletinData,
  GroupItem,
  WeeklyScheduleItem,
  WorshipServiceItem,
} from '../../../types/digitalBulletin'
import './DigitalBulletin.css'

const DigitalBulletin = () => {
  const isAdminUser = isAdmin()
  const { data } = useDigitalBulletin()
  const replaceMutation = useReplaceDigitalBulletin()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['worship']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  // 데이터 부분 변경 → 전체 PUT
  const save = async (next: BulletinData) => {
    try {
      await replaceMutation.mutateAsync(next)
    } catch (e) {
      console.error(e)
      showToast('저장에 실패했습니다', 'error')
    }
  }

  // 헬퍼들 — 모두 현재 data 기준으로 부분 변경 후 save
  const setTopField = (key: 'date' | 'title' | 'subtitle') => (value: string) =>
    save({ ...data, [key]: value })

  const setOffering = (value: string) =>
    save({ ...data, worship: { ...data.worship, offering: value } })
  const setPrayer = (value: string) =>
    save({ ...data, worship: { ...data.worship, prayer: value } })
  const setSermonField = (key: 'title' | 'subtitle') => (value: string) =>
    save({
      ...data,
      worship: { ...data.worship, sermon: { ...data.worship.sermon, [key]: value } },
    })

  const updateServiceField = (idx: number, key: keyof WorshipServiceItem) => (value: string) => {
    const next = [...data.worship.schedule]
    next[idx] = { ...next[idx], [key]: value }
    save({ ...data, worship: { ...data.worship, schedule: next } })
  }
  const addService = () =>
    save({
      ...data,
      worship: {
        ...data.worship,
        schedule: [
          ...data.worship.schedule,
          { name: '새 예배', time: '오전 0:00', preacher: '담당자' },
        ],
      },
    })
  const removeService = (idx: number) => {
    const next = data.worship.schedule.filter((_, i) => i !== idx)
    save({ ...data, worship: { ...data.worship, schedule: next } })
  }

  const updateAnnouncementField = (idx: number, key: keyof AnnouncementItem) => (value: string) => {
    const next = [...data.announcements]
    next[idx] = { ...next[idx], [key]: value }
    save({ ...data, announcements: next })
  }
  const addAnnouncement = () =>
    save({
      ...data,
      announcements: [
        ...data.announcements,
        { title: '새 소식 제목', content: '내용을 입력하세요.' },
      ],
    })
  const removeAnnouncement = (idx: number) =>
    save({ ...data, announcements: data.announcements.filter((_, i) => i !== idx) })

  const updateGroupField = (idx: number, key: keyof GroupItem) => (value: string) => {
    const next = [...data.groups]
    const parsed = key === 'members' ? Number(value) || 0 : value
    next[idx] = { ...next[idx], [key]: parsed } as GroupItem
    save({ ...data, groups: next })
  }
  const addGroup = () =>
    save({
      ...data,
      groups: [
        ...data.groups,
        { name: '새 구역', leader: '담당자', members: 0, meeting: '매주 ○요일' },
      ],
    })
  const removeGroup = (idx: number) =>
    save({ ...data, groups: data.groups.filter((_, i) => i !== idx) })

  const updateScheduleField = (idx: number, key: keyof WeeklyScheduleItem) => (value: string) => {
    const next = [...data.weeklySchedule]
    next[idx] = { ...next[idx], [key]: value }
    save({ ...data, weeklySchedule: next })
  }
  const addSchedule = () =>
    save({
      ...data,
      weeklySchedule: [
        ...data.weeklySchedule,
        { day: '월', event: '새 일정', time: '오전 0:00', location: '본당' },
      ],
    })
  const removeSchedule = (idx: number) =>
    save({ ...data, weeklySchedule: data.weeklySchedule.filter((_, i) => i !== idx) })

  return (
    <div className="digital-bulletin">
      {/* 헤더 */}
      <div className="digital-bulletin-header">
        <div className="bulletin-date">
          <EditableField
            value={data.date}
            isAdmin={isAdminUser}
            label="날짜"
            onSave={setTopField('date')}
          >
            {data.date}
          </EditableField>
        </div>
        <h1 className="bulletin-main-title" style={{ whiteSpace: 'pre-line' }}>
          <EditableField
            value={data.title}
            isAdmin={isAdminUser}
            multiline
            label="대표 제목"
            onSave={setTopField('title')}
          >
            {data.title}
          </EditableField>
        </h1>
        <p className="bulletin-scripture">
          <EditableField
            value={data.subtitle}
            isAdmin={isAdminUser}
            label="성경 구절"
            onSave={setTopField('subtitle')}
          >
            {data.subtitle}
          </EditableField>
        </p>
      </div>

      {/* 예배 안내 */}
      <section className="bulletin-section">
        <button className="section-header" onClick={() => toggleSection('worship')}>
          <div className="section-title">
            <span className="section-icon">🙏</span>
            <h2>주일오전예배</h2>
          </div>
          <span className={`expand-icon ${expandedSections.has('worship') ? 'expanded' : ''}`}>▼</span>
        </button>

        {expandedSections.has('worship') && (
          <div className="section-content">
            <div className="worship-schedule">
              {data.worship.schedule.map((service, idx) => (
                <div key={idx} className="worship-service" style={{ position: 'relative' }}>
                  <RemoveItemButton isAdmin={isAdminUser} onClick={() => removeService(idx)} />
                  <div className="service-info">
                    <span className="service-name">
                      <EditableField
                        value={service.name}
                        isAdmin={isAdminUser}
                        label="예배 이름"
                        onSave={updateServiceField(idx, 'name')}
                      >
                        {service.name}
                      </EditableField>
                    </span>
                    <span className="service-time">
                      <EditableField
                        value={service.time}
                        isAdmin={isAdminUser}
                        label="예배 시간"
                        onSave={updateServiceField(idx, 'time')}
                      >
                        {service.time}
                      </EditableField>
                    </span>
                  </div>
                  <div className="service-preacher">
                    <EditableField
                      value={service.preacher}
                      isAdmin={isAdminUser}
                      label="설교자"
                      onSave={updateServiceField(idx, 'preacher')}
                    >
                      {service.preacher}
                    </EditableField>
                  </div>
                </div>
              ))}
              <AddItemButton isAdmin={isAdminUser} onClick={addService} label="예배 추가" />
            </div>

            <div className="worship-details">
              <div className="detail-item">
                <span className="detail-label">찬송</span>
                <span className="detail-value">
                  <EditableField
                    value={data.worship.offering}
                    isAdmin={isAdminUser}
                    label="찬송"
                    onSave={setOffering}
                  >
                    {data.worship.offering}
                  </EditableField>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">기도</span>
                <span className="detail-value">
                  <EditableField
                    value={data.worship.prayer}
                    isAdmin={isAdminUser}
                    label="기도"
                    onSave={setPrayer}
                  >
                    {data.worship.prayer}
                  </EditableField>
                </span>
              </div>
              <div className="detail-item sermon">
                <span className="detail-label">설교</span>
                <div className="sermon-info">
                  <div className="sermon-title">
                    <EditableField
                      value={data.worship.sermon.title}
                      isAdmin={isAdminUser}
                      multiline
                      label="설교 제목"
                      onSave={setSermonField('title')}
                    >
                      {data.worship.sermon.title}
                    </EditableField>
                  </div>
                  <div className="sermon-subtitle">
                    <EditableField
                      value={data.worship.sermon.subtitle}
                      isAdmin={isAdminUser}
                      label="설교 부제"
                      onSave={setSermonField('subtitle')}
                    >
                      {data.worship.sermon.subtitle}
                    </EditableField>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 교회 소식 */}
      <section className="bulletin-section">
        <button className="section-header" onClick={() => toggleSection('announcements')}>
          <div className="section-title">
            <span className="section-icon">📢</span>
            <h2>교회 소식</h2>
          </div>
          <span className={`expand-icon ${expandedSections.has('announcements') ? 'expanded' : ''}`}>▼</span>
        </button>

        {expandedSections.has('announcements') && (
          <div className="section-content">
            <div className="announcements-list">
              {data.announcements.map((item, idx) => (
                <div key={idx} className="announcement-item" style={{ position: 'relative' }}>
                  <RemoveItemButton isAdmin={isAdminUser} onClick={() => removeAnnouncement(idx)} />
                  <h3 className="announcement-title">
                    <EditableField
                      value={item.title}
                      isAdmin={isAdminUser}
                      label="소식 제목"
                      onSave={updateAnnouncementField(idx, 'title')}
                    >
                      {item.title}
                    </EditableField>
                  </h3>
                  <p className="announcement-content" style={{ whiteSpace: 'pre-line' }}>
                    <EditableField
                      value={item.content}
                      isAdmin={isAdminUser}
                      multiline
                      label="소식 내용"
                      onSave={updateAnnouncementField(idx, 'content')}
                    >
                      {item.content}
                    </EditableField>
                  </p>
                </div>
              ))}
              <AddItemButton isAdmin={isAdminUser} onClick={addAnnouncement} label="소식 추가" />
            </div>
          </div>
        )}
      </section>

      {/* 구역 보고 */}
      <section className="bulletin-section">
        <button className="section-header" onClick={() => toggleSection('groups')}>
          <div className="section-title">
            <span className="section-icon">👥</span>
            <h2>구역 보고</h2>
          </div>
          <span className={`expand-icon ${expandedSections.has('groups') ? 'expanded' : ''}`}>▼</span>
        </button>

        {expandedSections.has('groups') && (
          <div className="section-content">
            <div className="groups-grid">
              {data.groups.map((group, idx) => (
                <div key={idx} className="group-card" style={{ position: 'relative' }}>
                  <RemoveItemButton isAdmin={isAdminUser} onClick={() => removeGroup(idx)} />
                  <div className="group-name">
                    <EditableField
                      value={group.name}
                      isAdmin={isAdminUser}
                      label="구역 이름"
                      onSave={updateGroupField(idx, 'name')}
                    >
                      {group.name}
                    </EditableField>
                  </div>
                  <div className="group-info">
                    <div className="group-detail">
                      <span className="label">구역장</span>
                      <span className="value">
                        <EditableField
                          value={group.leader}
                          isAdmin={isAdminUser}
                          label="구역장"
                          onSave={updateGroupField(idx, 'leader')}
                        >
                          {group.leader}
                        </EditableField>
                      </span>
                    </div>
                    <div className="group-detail">
                      <span className="label">인원</span>
                      <span className="value">
                        <EditableField
                          value={String(group.members)}
                          isAdmin={isAdminUser}
                          type="number"
                          label="인원"
                          onSave={updateGroupField(idx, 'members')}
                        >
                          {group.members}명
                        </EditableField>
                      </span>
                    </div>
                    <div className="group-detail">
                      <span className="label">모임</span>
                      <span className="value">
                        <EditableField
                          value={group.meeting}
                          isAdmin={isAdminUser}
                          label="모임"
                          onSave={updateGroupField(idx, 'meeting')}
                        >
                          {group.meeting}
                        </EditableField>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <AddItemButton isAdmin={isAdminUser} onClick={addGroup} label="구역 추가" />
            </div>
          </div>
        )}
      </section>

      {/* 주간 일정 */}
      <section className="bulletin-section">
        <button className="section-header" onClick={() => toggleSection('schedule')}>
          <div className="section-title">
            <span className="section-icon">📅</span>
            <h2>이번 주 일정</h2>
          </div>
          <span className={`expand-icon ${expandedSections.has('schedule') ? 'expanded' : ''}`}>▼</span>
        </button>

        {expandedSections.has('schedule') && (
          <div className="section-content">
            <div className="schedule-list">
              {data.weeklySchedule.map((item, idx) => (
                <div key={idx} className="schedule-item" style={{ position: 'relative' }}>
                  <RemoveItemButton isAdmin={isAdminUser} onClick={() => removeSchedule(idx)} />
                  <div className="schedule-day">
                    <EditableField
                      value={item.day}
                      isAdmin={isAdminUser}
                      label="요일"
                      onSave={updateScheduleField(idx, 'day')}
                    >
                      {item.day}
                    </EditableField>
                  </div>
                  <div className="schedule-details">
                    <div className="schedule-event">
                      <EditableField
                        value={item.event}
                        isAdmin={isAdminUser}
                        label="일정명"
                        onSave={updateScheduleField(idx, 'event')}
                      >
                        {item.event}
                      </EditableField>
                    </div>
                    <div className="schedule-meta">
                      <span className="schedule-time">
                        <EditableField
                          value={item.time}
                          isAdmin={isAdminUser}
                          label="시간"
                          onSave={updateScheduleField(idx, 'time')}
                        >
                          {item.time}
                        </EditableField>
                      </span>
                      <span className="schedule-location">
                        <EditableField
                          value={item.location}
                          isAdmin={isAdminUser}
                          label="장소"
                          onSave={updateScheduleField(idx, 'location')}
                        >
                          {item.location}
                        </EditableField>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <AddItemButton isAdmin={isAdminUser} onClick={addSchedule} label="일정 추가" />
            </div>
          </div>
        )}
      </section>

      {isAdminUser && (
        <div className="bulletin-admin-hint">
          ✏️ 아이콘으로 텍스트 수정 · ➕ 항목 추가 · 🗑️ 항목 삭제 · 변경은 즉시 저장됩니다.
        </div>
      )}
    </div>
  )
}

export default DigitalBulletin
