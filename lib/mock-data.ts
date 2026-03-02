export type ShiftType = '오픈' | '마감' | '미들' | '오_미단독' | '마_미단독' | '교육' | '출장' | '';
export type StatusType = '겸직' | '주휴' | '휴무' | '대휴' | '연차' | '휴가' | '경조' | '반차' | '반반차' | '';

export interface ScheduleEntry {
  time: string;
  shiftType: ShiftType;
  statusType: StatusType;
}

export interface ManagerSchedule {
  id: string;
  store: string;
  name: string;
  schedule: Record<string, ScheduleEntry>;
}

export const STORES = [
  '울산관', '동성로관', '동래관', '상인관', '성서관', '부산본점관', 
  '진주혁신관', '광복관', '창원관', '김해부원관', '제주연동관', '센텀시티관'
];

export const MANAGERS = [
  '송명호', '이준창', '정형진', '김락영', '김숙경', '문윤주', 
  '김종학', '김현준', '박정환', '신종도', '조호동', '이상의'
];

export const MOCK_DATA: ManagerSchedule[] = [
  {
    id: '1',
    store: '울산관',
    name: '송명호',
    schedule: {
      '2026-03-01': { time: '17:00', shiftType: '마감', statusType: '' },
      '2026-03-02': { time: '', shiftType: '', statusType: '휴무' },
      '2026-03-03': { time: '15:00', shiftType: '마감', statusType: '' },
      '2026-03-04': { time: '', shiftType: '', statusType: '휴무' },
      '2026-03-05': { time: '', shiftType: '', statusType: '주휴' },
      '2026-03-06': { time: '', shiftType: '', statusType: '주휴' },
    }
  },
  {
    id: '2',
    store: '동성로관',
    name: '이준창',
    schedule: {
      '2026-03-01': { time: '11:00', shiftType: '미들', statusType: '' },
      '2026-03-02': { time: '15:00', shiftType: '마감', statusType: '겸직' },
      '2026-03-03': { time: '15:00', shiftType: '마감', statusType: '겸직' },
      '2026-03-04': { time: '', shiftType: '', statusType: '주휴' },
      '2026-03-05': { time: '16:00', shiftType: '마감', statusType: '' },
      '2026-03-06': { time: '17:00', shiftType: '마감', statusType: '' },
    }
  },
  {
    id: '3',
    store: '동래관',
    name: '정형진',
    schedule: {
      '2026-03-01': { time: '13:00', shiftType: '미들', statusType: '' },
      '2026-03-02': { time: '09:00', shiftType: '오픈', statusType: '' },
      '2026-03-03': { time: '', shiftType: '', statusType: '휴무' },
      '2026-03-04': { time: '14:00', shiftType: '마감', statusType: '겸직' },
      '2026-03-05': { time: '14:00', shiftType: '마감', statusType: '겸직' },
      '2026-03-06': { time: '15:00', shiftType: '마감', statusType: '겸직' },
    }
  },
  {
    id: '4',
    store: '상인관',
    name: '김락영',
    schedule: {
      '2026-03-01': { time: '08:30', shiftType: '오픈', statusType: '' },
      '2026-03-02': { time: '', shiftType: '', statusType: '주휴' },
      '2026-03-03': { time: '08:30', shiftType: '오_미단독', statusType: '' },
      '2026-03-04': { time: '', shiftType: '', statusType: '주휴' },
      '2026-03-05': { time: '09:00', shiftType: '오픈', statusType: '겸직' },
      '2026-03-06': { time: '16:00', shiftType: '마감', statusType: '겸직' },
    }
  },
  {
    id: '5',
    store: '성서관',
    name: '김숙경',
    schedule: {
      '2026-03-01': { time: '10:00', shiftType: '미들', statusType: '' },
      '2026-03-02': { time: '10:00', shiftType: '미들', statusType: '' },
      '2026-03-03': { time: '15:30', shiftType: '마감', statusType: '' },
      '2026-03-04': { time: '', shiftType: '', statusType: '주휴' },
      '2026-03-05': { time: '09:00', shiftType: '오픈', statusType: '반차' },
      '2026-03-06': { time: '16:30', shiftType: '마감', statusType: '' },
    }
  },
  {
    id: '6',
    store: '진주혁신관',
    name: '김종학',
    schedule: {
      '2026-03-01': { time: '', shiftType: '', statusType: '휴무' },
      '2026-03-02': { time: '09:00', shiftType: '오픈', statusType: '' },
      '2026-03-03': { time: '10:00', shiftType: '오픈', statusType: '' },
      '2026-03-04': { time: '10:00', shiftType: '오픈', statusType: '' },
      '2026-03-05': { time: '', shiftType: '', statusType: '주휴' },
      '2026-03-06': { time: '13:30', shiftType: '마감', statusType: '' },
    }
  }
];
