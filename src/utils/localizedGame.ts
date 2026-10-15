import { Question, Team, GameState, Language } from '../types/game';

/**
 * Returns a localized copy of a Question.
 * When lang === 'en', it overlays the English title, description, explanation,
 * and payload if provided.
 */
export function getLocalizedQuestion(question: Question, lang: Language): Question {
  if (lang !== 'en') {
    return question;
  }
  return {
    ...question,
    title: question.title_en || question.title,
    description: question.description_en || question.description,
    explanation: question.explanation_en !== undefined ? question.explanation_en : question.explanation,
    payload: question.payload_en || question.payload
  };
}

export function getLocalizedTeam(team: Team, lang: Language): Team {
  if (lang !== 'en') {
    return team;
  }
  return {
    ...team,
    name: team.name_en || team.name,
    slogan: team.slogan_en !== undefined ? team.slogan_en : team.slogan
  };
}

export function getLocalizedGameState(state: GameState, lang: Language): GameState {
  if (lang !== 'en') {
    return state;
  }
  return {
    ...state,
    title: state.title_en || state.title,
    description: state.description_en || state.description,
    synthesisPrompt: state.synthesisPrompt_en || state.synthesisPrompt,
    teams: state.teams.map((t) => getLocalizedTeam(t, lang)),
    questions: state.questions.map((q) => getLocalizedQuestion(q, lang))
  };
}
