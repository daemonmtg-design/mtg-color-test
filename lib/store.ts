import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Version = 'quick' | 'long' | null;

export type QuizState = {
  status: 'landing' | 'consent' | 'version' | 'country' | 'values' | 'personality' | 'motivations' | 'dilemmas' | 'experience' | 'submitting' | 'results';
  version: Version;
  country: string | null;
  magic_experience: string | null;
  section_times: Record<string, number>;
  section_start_time: number | null;
  answers: {
    values: Record<string, number>;
    personality: Record<string, number>;
    motivations: Record<string, number>;
    dilemmas: Record<string, { most: string; least: string }>;
  };
  dilemmaOrder: Record<string, string[]>;
  secret_token: string | null;
  public_id: string | null;
  friend_token: string | null;
  
  setStatus: (s: QuizState['status']) => void;
  setVersion: (v: Version) => void;
  setCountry: (c: string | null) => void;
  setMagicExperience: (exp: string | null) => void;
  markSectionStart: () => void;
  recordSectionTime: (section: string) => void;
  setAnswer: (section: keyof QuizState['answers'], id: string, val: any) => void;
  setDilemmaOrder: (groupId: string, order: string[]) => void;
  setSecretToken: (t: string | null) => void;
  setPublicId: (id: string | null) => void;
  setFriendToken: (t: string | null) => void;
  reset: () => void;
};

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      status: 'landing',
      version: null,
      country: null,
      magic_experience: null,
      section_times: {},
      section_start_time: null,
      answers: {
        values: {},
        personality: {},
        motivations: {},
        dilemmas: {}
      },
      dilemmaOrder: {},
      secret_token: null,
      public_id: null,
      friend_token: null,
      
      setStatus: (status) => set({ status }),
      setVersion: (version) => set({ version }),
      setCountry: (country) => set({ country }),
      setMagicExperience: (magic_experience) => set({ magic_experience }),
      markSectionStart: () => set({ section_start_time: Date.now() }),
      recordSectionTime: (section) => set((state) => {
        if (!state.section_start_time) return state;
        const elapsed = (Date.now() - state.section_start_time) / 1000; // in seconds
        return {
          section_times: {
            ...state.section_times,
            [section]: (state.section_times[section] || 0) + elapsed
          },
          section_start_time: null
        };
      }),
      setSecretToken: (secret_token) => set({ secret_token }),
      setPublicId: (public_id) => set({ public_id }),
      setFriendToken: (friend_token) => set({ friend_token }),
      setAnswer: (section, id, val) => set((state) => ({
        answers: {
          ...state.answers,
          [section]: {
            ...state.answers[section],
            [id]: val
          }
        }
      })),
      setDilemmaOrder: (groupId, order) => set((state) => ({
        dilemmaOrder: {
          ...state.dilemmaOrder,
          [groupId]: order
        }
      })),
      reset: () => set({
        status: 'landing',
        version: null,
        country: null,
        magic_experience: null,
        section_times: {},
        section_start_time: null,
        answers: { values: {}, personality: {}, motivations: {}, dilemmas: {} },
        dilemmaOrder: {},
        secret_token: null,
        public_id: null,
        friend_token: null
      })
    }),
    {
      name: 'mtg-quiz-storage',
    }
  )
);
