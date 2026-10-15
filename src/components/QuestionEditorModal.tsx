import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Sparkles,
  AlertCircle,
  ListChecks,
  Target,
  FileText,
  Camera,
  Film,
  Video,
  Image as ImageIcon,
  QrCode,
  Languages,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import {
  Question,
  Team,
  QuestionType,
  Language,
  TextMatchPair,
  ImageMatchPair,
  TaskPayload
} from '../types/game';
import { translations } from '../locales/translations';
import { ImageSourcePicker } from './ImageSourcePicker';
import { SVG_IMAGES, INITIAL_GAME_STATE } from '../data/defaultGame';
import { translateGreekToEnglish, translateGreekToEnglishAsync, translateQuestionAsync, containsGreekCharacters } from '../utils/translator';

interface Props {
  question?: Question | null; // If null, creates new question; if provided, edits existing question
  teams: Team[];
  lang: Language;
  initialTeamId?: string; // If creating while viewing a specific team tab
  initialTab?: 'both' | 'el' | 'en';
  onSave: (question: Question) => void;
  onClose: () => void;
}

export const QuestionEditorModal: React.FC<Props> = ({
  question,
  teams,
  lang,
  initialTeamId,
  initialTab,
  onSave,
  onClose
}) => {
  const t = translations[lang];
  const isEditing = !!question;

  // Active language tab: 'both' (Bilingual side-by-side / simultaneously), 'el' (Greek only), or 'en' (English final editing)
  const [editorTab, setEditorTab] = useState<'both' | 'el' | 'en'>(initialTab || 'both');
  const [translationNotification, setTranslationNotification] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isTranslatingField, setIsTranslatingField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Detect if question is from default template and has customized Greek text
  const defaultDef = question ? INITIAL_GAME_STATE.questions.find((dq) => dq.id === question.id) : null;
  const hasCustomizedTitle = !!(defaultDef && question && question.title !== defaultDef.title);
  const isStaleTemplateTitle = hasCustomizedTitle && question?.title_en === defaultDef?.title_en;
  const isStaleTemplatePayload = hasCustomizedTitle && question?.payload_en === defaultDef?.payload_en;

  // Greek Form states
  const [title, setTitle] = useState<string>(question?.title || '');
  const [description, setDescription] = useState<string>(question?.description || '');
  const [type, setType] = useState<QuestionType>(question?.type || 'multiple_choice');
  const [points, setPoints] = useState<number>(question?.points || 100);
  const [hasPhoto, setHasPhoto] = useState<boolean>(!!question?.imageUrl);
  const [imageUrl, setImageUrl] = useState<string>(question?.imageUrl || '');
  const [explanation, setExplanation] = useState<string>(question?.explanation || '');
  const [isActive, setIsActive] = useState<boolean>(question?.isActive !== false);

  // English Form states (for bilingual support & editing)
  const [titleEn, setTitleEn] = useState<string>(() => {
    if (isStaleTemplateTitle) return '';
    return question?.title_en || (question?.title ? translateGreekToEnglish(question.title) : '');
  });
  const [descriptionEn, setDescriptionEn] = useState<string>(() => {
    if (hasCustomizedTitle && defaultDef && question?.description_en === defaultDef.description_en) return '';
    return question?.description_en || (question?.description ? translateGreekToEnglish(question.description) : '');
  });
  const [explanationEn, setExplanationEn] = useState<string>(() => {
    if (hasCustomizedTitle && defaultDef && question?.explanation_en === defaultDef.explanation_en) return '';
    return question?.explanation_en || (question?.explanation ? translateGreekToEnglish(question.explanation) : '');
  });

  // Assigned teams: array of team IDs. Empty or undefined means assigned to ALL teams
  const [assignedTeamIds, setAssignedTeamIds] = useState<string[]>(
    question?.assignedTeamIds || (!question && initialTeamId ? [initialTeamId] : [])
  );

  // Type specific payloads:
  // 1. Multiple Choice
  const [mcOptions, setMcOptions] = useState<string[]>(
    question?.type === 'multiple_choice'
      ? (question.payload as any).options || ['Επιλογή 1', 'Επιλογή 2', 'Επιλογή 3', 'Επιλογή 4']
      : ['Επιλογή 1', 'Επιλογή 2', 'Επιλογή 3', 'Επιλογή 4']
  );
  const [mcCorrectIndices, setMcCorrectIndices] = useState<number[]>(() => {
    if (question?.type === 'multiple_choice') {
      const p = question.payload as any;
      if (Array.isArray(p.correctOptionIndices) && p.correctOptionIndices.length > 0) {
        return p.correctOptionIndices;
      }
      if (typeof p.correctOptionIndex === 'number') {
        return [p.correctOptionIndex];
      }
    }
    return [0];
  });
  const [mcOptionsEn, setMcOptionsEn] = useState<string[]>(() => {
    if (!isStaleTemplatePayload && question?.payload_en && Array.isArray((question.payload_en as any).options)) {
      return (question.payload_en as any).options;
    }
    const currentGreekOpts = (question?.payload as any)?.options || mcOptions;
    return currentGreekOpts.map((o: string) => translateGreekToEnglish(o));
  });

  // 2. True / False
  const [tfCorrectVal, setTfCorrectVal] = useState<boolean>(
    question?.type === 'true_false'
      ? (question.payload as any).correctValue ?? true
      : true
  );

  // 3. Text Match
  const [textPairs, setTextPairs] = useState<TextMatchPair[]>(
    question?.type === 'text_match'
      ? (question.payload as any).pairs || [
          { id: '1', left: 'Ελλάδα', right: 'Αθήνα' },
          { id: '2', left: 'Γαλλία', right: 'Παρίσι' }
        ]
      : [
          { id: '1', left: 'Στοιχείο Α', right: 'Ταίρι Α' },
          { id: '2', left: 'Στοιχείο Β', right: 'Ταίρι Β' }
        ]
  );
  const [textPairsEn, setTextPairsEn] = useState<TextMatchPair[]>(() => {
    if (!isStaleTemplatePayload && question?.payload_en && Array.isArray((question.payload_en as any).pairs)) {
      return (question.payload_en as any).pairs;
    }
    const basePairs = (question?.payload as any)?.pairs || textPairs;
    return basePairs.map((p: TextMatchPair) => ({
      ...p,
      left: translateGreekToEnglish(p.left),
      right: translateGreekToEnglish(p.right)
    }));
  });

  // 4. Image Match
  const [imagePairs, setImagePairs] = useState<ImageMatchPair[]>(
    question?.type === 'image_match'
      ? (question.payload as any).pairs || [
          { id: '1', image: SVG_IMAGES.telescope, text: 'Τηλεσκόπιο' },
          { id: '2', image: SVG_IMAGES.compass, text: 'Πυξίδα' }
        ]
      : [
          { id: '1', image: SVG_IMAGES.telescope, text: 'Τηλεσκόπιο' },
          { id: '2', image: SVG_IMAGES.compass, text: 'Πυξίδα' }
        ]
  );
  const [imagePairsEn, setImagePairsEn] = useState<ImageMatchPair[]>(() => {
    if (!isStaleTemplatePayload && question?.payload_en && Array.isArray((question.payload_en as any).pairs)) {
      return (question.payload_en as any).pairs;
    }
    const basePairs = (question?.payload as any)?.pairs || imagePairs;
    return basePairs.map((p: ImageMatchPair) => ({
      ...p,
      text: translateGreekToEnglish(p.text)
    }));
  });

  // 5. QR Code & Unlocked Media (Photo / Video)
  const [qrCodeTarget, setQrCodeTarget] = useState<string>(
    question?.type === 'qr_scan'
      ? (question.payload as any).targetCode || 'STATION-01'
      : 'STATION-01'
  );
  const [qrHint, setQrHint] = useState<string>(
    question?.type === 'qr_scan'
      ? (question.payload as any).locationHint || ''
      : ''
  );
  const [qrHintEn, setQrHintEn] = useState<string>(() => {
    if (question?.payload_en) {
      return (question.payload_en as any).locationHint || '';
    }
    return question?.payload && (question.payload as any).locationHint
      ? translateGreekToEnglish((question.payload as any).locationHint)
      : '';
  });
  const [qrMediaType, setQrMediaType] = useState<'image' | 'video'>(() => {
    if (question?.type === 'qr_scan') {
      const p = question.payload as any;
      if (p.unlockedMedia?.type) return p.unlockedMedia.type;
      if (p.unlockedVideoUrl) return 'video';
    }
    return 'image';
  });
  const [qrMediaUrl, setQrMediaUrl] = useState<string>(() => {
    if (question?.type === 'qr_scan') {
      const p = question.payload as any;
      return p.unlockedMedia?.url || p.unlockedImageUrl || p.unlockedVideoUrl || question.imageUrl || '';
    }
    return '';
  });
  const [qrMediaTitle, setQrMediaTitle] = useState<string>(() => {
    if (question?.type === 'qr_scan') {
      const p = question.payload as any;
      return p.unlockedMedia?.title || '';
    }
    return '';
  });
  const [qrMediaTitleEn, setQrMediaTitleEn] = useState<string>(() => {
    if (question?.payload_en) {
      return (question.payload_en as any).unlockedMedia?.title || '';
    }
    const greekMediaTitle = (question?.payload as any)?.unlockedMedia?.title;
    return greekMediaTitle ? translateGreekToEnglish(greekMediaTitle) : '';
  });
  const [qrMediaCaption, setQrMediaCaption] = useState<string>(() => {
    if (question?.type === 'qr_scan') {
      const p = question.payload as any;
      return p.unlockedMedia?.caption || '';
    }
    return '';
  });
  const [qrMediaCaptionEn, setQrMediaCaptionEn] = useState<string>(() => {
    if (question?.payload_en) {
      return (question.payload_en as any).unlockedMedia?.caption || '';
    }
    const greekMediaCaption = (question?.payload as any)?.unlockedMedia?.caption;
    return greekMediaCaption ? translateGreekToEnglish(greekMediaCaption) : '';
  });

  // 6. Photo mission
  const [photoInstructions, setPhotoInstructions] = useState<string>(
    question?.type === 'photo_upload'
      ? (question.payload as any).instructions || ''
      : ''
  );
  const [photoInstructionsEn, setPhotoInstructionsEn] = useState<string>(() => {
    if (question?.payload_en) {
      return (question.payload_en as any).instructions || '';
    }
    return question?.payload && (question.payload as any).instructions
      ? translateGreekToEnglish((question.payload as any).instructions)
      : '';
  });

  // 7. Puzzle
  const [puzzleGridSize, setPuzzleGridSize] = useState<4 | 6 | 9>(
    question?.type === 'puzzle'
      ? (question.payload as any).gridPieces || 6
      : 6
  );
  const [puzzleImage, setPuzzleImage] = useState<string>(
    question?.type === 'puzzle'
      ? (question.payload as any).imageUrl || question?.imageUrl || SVG_IMAGES.treasureMap
      : SVG_IMAGES.treasureMap
  );

  // 8. Task / Mission
  const [taskInstructions, setTaskInstructions] = useState<string>(
    question?.type === 'task'
      ? (question.payload as TaskPayload).instructions || ''
      : ''
  );
  const [taskInstructionsEn, setTaskInstructionsEn] = useState<string>(() => {
    if (question?.payload_en) {
      return (question.payload_en as any).instructions || '';
    }
    return question?.payload && (question.payload as any).instructions
      ? translateGreekToEnglish((question.payload as any).instructions)
      : '';
  });
  const [taskChecklist, setTaskChecklist] = useState<string[]>(
    question?.type === 'task'
      ? (question.payload as TaskPayload).checklist || [
          'Βήμα 1: Εντοπίστε το αντικείμενο / σταθμό',
          'Βήμα 2: Συνεργαστείτε και καταγράψτε τα στοιχεία'
        ]
      : [
          'Βήμα 1: Εντοπίστε το αντικείμενο / σταθμό',
          'Βήμα 2: Συνεργαστείτε και καταγράψτε τα στοιχεία'
        ]
  );
  const [taskChecklistEn, setTaskChecklistEn] = useState<string[]>(() => {
    if (!isStaleTemplatePayload && question?.payload_en && Array.isArray((question.payload_en as any).checklist)) {
      return (question.payload_en as any).checklist;
    }
    const currentGreekList = (question?.payload as any)?.checklist || taskChecklist;
    return currentGreekList.map((c: string) => translateGreekToEnglish(c));
  });
  const [taskEvidence, setTaskEvidence] = useState<'text' | 'photo' | 'both' | 'confirmation_only'>(
    question?.type === 'task'
      ? (question.payload as TaskPayload).requiresEvidence || 'text'
      : 'text'
  );
  const [taskPrompt, setTaskPrompt] = useState<string>(
    question?.type === 'task'
      ? (question.payload as TaskPayload).completionPrompt || ''
      : ''
  );
  const [taskPromptEn, setTaskPromptEn] = useState<string>(() => {
    if (question?.payload_en) {
      return (question.payload_en as any).completionPrompt || '';
    }
    return question?.payload && (question.payload as any).completionPrompt
      ? translateGreekToEnglish((question.payload as any).completionPrompt)
      : '';
  });

  // Team assignment toggle helpers
  const isAllTeams = assignedTeamIds.length === 0 || assignedTeamIds.length === teams.length;

  const handleToggleAllTeams = () => {
    if (isAllTeams) {
      setAssignedTeamIds([teams[0].id]);
    } else {
      setAssignedTeamIds([]);
    }
  };

  const handleToggleTeam = (teamId: string) => {
    if (isAllTeams) {
      const remaining = teams.map((t) => t.id).filter((id) => id !== teamId);
      setAssignedTeamIds(remaining);
    } else {
      if (assignedTeamIds.includes(teamId)) {
        const next = assignedTeamIds.filter((id) => id !== teamId);
        setAssignedTeamIds(next.length === 0 ? [teamId] : next);
      } else {
        const next = [...assignedTeamIds, teamId];
        if (next.length === teams.length) {
          setAssignedTeamIds([]);
        } else {
          setAssignedTeamIds(next);
        }
      }
    }
  };

  const isTeamChecked = (teamId: string) => {
    if (assignedTeamIds.length === 0) return true;
    return assignedTeamIds.includes(teamId);
  };

  // One-click Neural Auto-Translate from Greek into English
  const handleAutoTranslateToEnglish = async () => {
    if (isTranslating) return;
    setIsTranslating(true);
    setTranslationNotification(
      lang === 'el' ? '⏳ Μετάφραση όλων των κειμένων στα Αγγλικά σε εξέλιξη...' : '⏳ Translating all texts to English...'
    );

    try {
      // Build current Greek payload
      let currentPayload: any = {};
      if (type === 'multiple_choice') {
        currentPayload = { options: mcOptions.filter((o) => o.trim()) };
      } else if (type === 'text_match') {
        currentPayload = { pairs: textPairs };
      } else if (type === 'image_match') {
        currentPayload = { pairs: imagePairs };
      } else if (type === 'qr_scan') {
        currentPayload = { locationHint: qrHint, unlockedMedia: { title: qrMediaTitle, caption: qrMediaCaption } };
      } else if (type === 'photo_upload') {
        currentPayload = { instructions: photoInstructions };
      } else if (type === 'task') {
        currentPayload = { instructions: taskInstructions, checklist: taskChecklist, completionPrompt: taskPrompt };
      }

      const qToTranslate: Question = {
        id: question?.id || 'temp',
        title: title.trim(),
        description: description.trim() || title.trim(),
        explanation: explanation.trim() || undefined,
        type,
        points,
        payload: currentPayload
      };

      const transResult = await translateQuestionAsync(qToTranslate);

      if (transResult.title_en) setTitleEn(transResult.title_en);
      if (transResult.description_en) setDescriptionEn(transResult.description_en);
      if (transResult.explanation_en) setExplanationEn(transResult.explanation_en);

      if (transResult.payload_en) {
        const pen = transResult.payload_en;
        if (type === 'multiple_choice' && Array.isArray(pen.options)) {
          setMcOptionsEn(pen.options);
        } else if (type === 'text_match' && Array.isArray(pen.pairs)) {
          setTextPairsEn(pen.pairs);
        } else if (type === 'image_match' && Array.isArray(pen.pairs)) {
          setImagePairsEn(pen.pairs);
        } else if (type === 'qr_scan') {
          if (pen.locationHint) setQrHintEn(pen.locationHint);
          if (pen.unlockedMedia?.title) setQrMediaTitleEn(pen.unlockedMedia.title);
          if (pen.unlockedMedia?.caption) setQrMediaCaptionEn(pen.unlockedMedia.caption);
        } else if (type === 'photo_upload') {
          if (pen.instructions) setPhotoInstructionsEn(pen.instructions);
        } else if (type === 'task') {
          if (pen.instructions) setTaskInstructionsEn(pen.instructions);
          if (Array.isArray(pen.checklist)) setTaskChecklistEn(pen.checklist);
          if (pen.completionPrompt) setTaskPromptEn(pen.completionPrompt);
        }
      }

      setEditorTab('en');
      setTranslationNotification(
        lang === 'el'
          ? '✓ Όλα τα ελληνικά κείμενα μεταφράστηκαν στα Αγγλικά! Μπορείτε τώρα να κάνετε τις τελικές σας διορθώσεις παρακάτω.'
          : '✓ All Greek texts translated to English! You can now make your final touch-ups below.'
      );
    } catch (err) {
      console.error('Translation error:', err);
      setTranslationNotification(
        lang === 'el'
          ? '⚠️ Παρουσιάστηκε σφάλμα κατά τη μετάφραση. Δοκιμάστε ξανά.'
          : '⚠️ Translation error. Please try again.'
      );
    } finally {
      setIsTranslating(false);
      setTimeout(() => setTranslationNotification(null), 6000);
    }
  };

  // Field-level translation helpers
  const handleTranslateTitleOnly = async () => {
    if (!title.trim() || isTranslating) return;
    setIsTranslatingField('title');
    try {
      const trans = await translateGreekToEnglishAsync(title);
      setTitleEn(trans);
    } finally {
      setIsTranslatingField(null);
    }
  };

  const handleTranslateDescriptionOnly = async () => {
    if (!description.trim() || isTranslating) return;
    setIsTranslatingField('description');
    try {
      const trans = await translateGreekToEnglishAsync(description);
      setDescriptionEn(trans);
    } finally {
      setIsTranslatingField(null);
    }
  };

  const handleTranslateExplanationOnly = async () => {
    if (!explanation.trim() || isTranslating) return;
    setIsTranslatingField('explanation');
    try {
      const trans = await translateGreekToEnglishAsync(explanation);
      setExplanationEn(trans);
    } finally {
      setIsTranslatingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Greek primary payload
      let payload: any = {};
      if (type === 'multiple_choice') {
        const validOptions = mcOptions.filter((o) => o.trim().length > 0);
        const validIndices = mcCorrectIndices.filter((i) => i < validOptions.length);
        const finalIndices = validIndices.length > 0 ? validIndices : [0];
        payload = {
          options: validOptions,
          correctOptionIndices: finalIndices,
          correctOptionIndex: finalIndices[0]
        };
      } else if (type === 'true_false') {
        payload = {
          correctValue: tfCorrectVal
        };
      } else if (type === 'text_match') {
        payload = {
          pairs: textPairs
        };
      } else if (type === 'image_match') {
        payload = {
          pairs: imagePairs
        };
      } else if (type === 'qr_scan') {
        const cleanUrl = qrMediaUrl.trim();
        payload = {
          targetCode: qrCodeTarget.toUpperCase().trim(),
          locationHint: qrHint.trim() || undefined,
          unlockedMedia: cleanUrl
            ? {
                type: qrMediaType,
                url: cleanUrl,
                title: qrMediaTitle.trim() || undefined,
                caption: qrMediaCaption.trim() || undefined
              }
            : undefined,
          unlockedImageUrl: qrMediaType === 'image' && cleanUrl ? cleanUrl : undefined,
          unlockedVideoUrl: qrMediaType === 'video' && cleanUrl ? cleanUrl : undefined
        };
      } else if (type === 'photo_upload') {
        payload = {
          instructions: photoInstructions.trim() || description.trim()
        };
      } else if (type === 'puzzle') {
        payload = {
          imageUrl: puzzleImage || imageUrl || SVG_IMAGES.treasureMap,
          gridPieces: puzzleGridSize
        };
      } else if (type === 'task') {
        payload = {
          instructions: taskInstructions.trim() || description.trim(),
          checklist: taskChecklist.filter((item) => item.trim().length > 0),
          requiresEvidence: taskEvidence,
          completionPrompt: taskPrompt.trim() || undefined
        };
      }

      // English payload construction (for full bilingual support)
      let payload_en: any = undefined;
      if (type === 'multiple_choice') {
        const validOptionsEn = mcOptionsEn.filter((o) => o.trim().length > 0);
        if (validOptionsEn.length > 0) {
          payload_en = {
            options: validOptionsEn,
            correctOptionIndices: payload.correctOptionIndices,
            correctOptionIndex: payload.correctOptionIndex
          };
        }
      } else if (type === 'true_false') {
        payload_en = {
          correctValue: tfCorrectVal
        };
      } else if (type === 'text_match') {
        const validPairsEn = textPairsEn.filter((p) => p.left.trim() || p.right.trim());
        if (validPairsEn.length > 0) {
          payload_en = { pairs: validPairsEn };
        }
      } else if (type === 'image_match') {
        const validImagePairsEn = imagePairsEn.filter((p) => p.text.trim());
        if (validImagePairsEn.length > 0) {
          payload_en = { pairs: validImagePairsEn };
        }
      } else if (type === 'qr_scan') {
        const cleanUrl = qrMediaUrl.trim();
        payload_en = {
          targetCode: qrCodeTarget.toUpperCase().trim(),
          locationHint: qrHintEn.trim() || undefined,
          unlockedMedia: cleanUrl
            ? {
                type: qrMediaType,
                url: cleanUrl,
                title: qrMediaTitleEn.trim() || qrMediaTitle.trim() || undefined,
                caption: qrMediaCaptionEn.trim() || qrMediaCaption.trim() || undefined
              }
            : undefined
        };
      } else if (type === 'photo_upload') {
        if (photoInstructionsEn.trim()) {
          payload_en = { instructions: photoInstructionsEn.trim() };
        }
      } else if (type === 'puzzle') {
        payload_en = {
          imageUrl: puzzleImage || imageUrl || SVG_IMAGES.treasureMap,
          gridPieces: puzzleGridSize
        };
      } else if (type === 'task') {
        payload_en = {
          instructions: taskInstructionsEn.trim() || descriptionEn.trim() || undefined,
          checklist: taskChecklistEn.filter((item) => item.trim().length > 0),
          requiresEvidence: taskEvidence,
          completionPrompt: taskPromptEn.trim() || undefined
        };
      }

      // Detect fields that need English neural translation
      const needTitleTrans = !titleEn.trim() || containsGreekCharacters(titleEn) || isStaleTemplateTitle;
      const needDescTrans = description.trim().length > 0 && (!descriptionEn.trim() || containsGreekCharacters(descriptionEn));
      const needExpTrans = explanation.trim().length > 0 && (!explanationEn.trim() || containsGreekCharacters(explanationEn));

      let needPayloadTrans = false;
      if (type === 'multiple_choice') {
        const validOptCount = (payload.options || []).length;
        needPayloadTrans =
          !payload_en?.options ||
          payload_en.options.length !== validOptCount ||
          payload_en.options.some((o: string) => containsGreekCharacters(o));
      } else if (type === 'task') {
        needPayloadTrans =
          !payload_en?.instructions ||
          containsGreekCharacters(payload_en.instructions) ||
          !payload_en?.checklist ||
          payload_en.checklist.length !== (payload.checklist || []).length ||
          payload_en.checklist.some((c: string) => containsGreekCharacters(c));
      } else if (type === 'text_match') {
        needPayloadTrans =
          !payload_en?.pairs ||
          payload_en.pairs.length !== (payload.pairs || []).length ||
          payload_en.pairs.some((p: any) => containsGreekCharacters(p.left) || containsGreekCharacters(p.right));
      } else if (type === 'image_match') {
        needPayloadTrans =
          !payload_en?.pairs ||
          payload_en.pairs.length !== (payload.pairs || []).length ||
          payload_en.pairs.some((p: any) => containsGreekCharacters(p.text));
      } else if (type === 'photo_upload') {
        needPayloadTrans = !payload_en?.instructions || containsGreekCharacters(payload_en.instructions);
      } else if (type === 'qr_scan') {
        needPayloadTrans = qrHint.trim().length > 0 && (!qrHintEn.trim() || containsGreekCharacters(qrHintEn));
      }

      let finalTitleEn = titleEn.trim();
      let finalDescEn = descriptionEn.trim();
      let finalExpEn = explanationEn.trim() || undefined;
      let finalPayloadEn = payload_en;

      if (needTitleTrans || needDescTrans || needExpTrans || needPayloadTrans) {
        setTranslationNotification(
          lang === 'el' ? '⏳ Αυτόματος συγχρονισμός αγγλικής μετάφρασης...' : '⏳ Syncing English translation...'
        );

        const tempQ: Question = {
          id: question?.id || 'temp',
          title: title.trim(),
          description: description.trim() || title.trim(),
          explanation: explanation.trim() || undefined,
          type,
          points: Number(points) || 100,
          payload
        };

        try {
          const transResult = await translateQuestionAsync(tempQ);
          if (needTitleTrans && transResult.title_en) {
            finalTitleEn = transResult.title_en;
          }
          if (needDescTrans && transResult.description_en) {
            finalDescEn = transResult.description_en;
          }
          if (needExpTrans && transResult.explanation_en) {
            finalExpEn = transResult.explanation_en;
          }
          if (needPayloadTrans && transResult.payload_en) {
            finalPayloadEn = transResult.payload_en;
          }
        } catch (transErr) {
          console.warn('Auto translation during submit failed, proceeding with fallback:', transErr);
        }
      }

      if (!finalTitleEn) {
        finalTitleEn = title.trim();
      }
      if (!finalDescEn) {
        finalDescEn = description.trim() || finalTitleEn;
      }

      const saved: Question = {
        id: question?.id || `quest-${Date.now()}`,
        title: title.trim(),
        title_en: finalTitleEn,
        description: description.trim() || title.trim(),
        description_en: finalDescEn,
        type,
        points: Number(points) || 100,
        imageUrl:
          type === 'puzzle'
            ? puzzleImage || imageUrl
            : hasPhoto && imageUrl
            ? imageUrl
            : undefined,
        assignedTeamIds:
          assignedTeamIds.length === 0 || assignedTeamIds.length === teams.length
            ? undefined
            : assignedTeamIds,
        isActive,
        explanation: explanation.trim() || undefined,
        explanation_en: finalExpEn,
        payload,
        payload_en: finalPayloadEn
      };

      onSave(saved);
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-20">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>
                {isEditing
                  ? lang === 'el'
                    ? 'Επεξεργασία Αποστολής'
                    : 'Edit Quest'
                  : lang === 'el'
                  ? 'Νέα Αποστολή / Δραστηριότητα'
                  : 'New Quest'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'el'
                ? 'Ρυθμίστε κείμενα, αγγλική μετάφραση, πολυμέσα και ομάδες'
                : 'Manage texts, English translation, media, and teams'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 space-y-5 flex-1">
          {/* Active / Inactive Status Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-200 block">
                {lang === 'el' ? 'Κατάσταση Δραστηριότητας' : 'Quest Status'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isActive
                  ? lang === 'el'
                    ? 'Ενεργή — Εμφανίζεται στις ομάδες και στον πίνακα'
                    : 'Active — Visible on board and team screens'
                  : lang === 'el'
                  ? 'Απενεργοποιημένη — Κρυφή από τους παίκτες'
                  : 'Inactive — Hidden from playing arena'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-slate-950' : 'bg-slate-500'}`} />
              <span>
                {isActive
                  ? lang === 'el'
                    ? 'ΕΝΕΡΓΗ'
                    : 'ACTIVE'
                  : lang === 'el'
                  ? 'ΑΠΕΝΕΡΓΟΠΟΙΗΜΕΝΗ'
                  : 'DISABLED'}
              </span>
            </button>
          </div>

          {/* Bilingual Language Selector & One-Click Auto-Translate Bar */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-sky-400" />
                  <span>{lang === 'el' ? 'Γλώσσα Επεξεργασίας Κειμένων' : 'Text Editing Language'}</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {lang === 'el'
                    ? 'Γράψτε στα Ελληνικά ή επεξεργαστείτε την Αγγλική έκδοση της αποστολής:'
                    : 'Write in Greek or review and edit the English version:'}
                </span>
              </div>

              {/* Language Switch Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditorTab('both')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    editorTab === 'both'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={lang === 'el' ? 'Ταυτόχρονη προβολή και των δύο γλωσσών' : 'View both languages simultaneously'}
                >
                  <span>🌐</span>
                  <span>{lang === 'el' ? 'Δίγλωσση (EL + EN)' : 'Bilingual (EL + EN)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditorTab('el')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    editorTab === 'el'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🇬🇷</span>
                  <span>{lang === 'el' ? 'Μόνο Ελληνικά' : 'Greek Only'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditorTab('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    editorTab === 'en'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={lang === 'el' ? 'Τελικό editing της Αγγλικής έκδοσης' : 'Final English editing'}
                >
                  <span>🇬🇧</span>
                  <span>{lang === 'el' ? 'Αγγλικά (Τελικό Editing)' : 'English Only'}</span>
                  {titleEn && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* Auto-Translate Helper Button */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-[11px] text-slate-400">
                {lang === 'el'
                  ? '💡 Πατήστε «Αυτόματη Μετάφραση» για να μεταφραστούν άμεσα όλα τα ελληνικά κείμενα στα Αγγλικά και μετά κάντε τις τελικές σας διορθώσεις!'
                  : '💡 Click "Auto-Translate" to translate Greek text into English and perform your final editing!'}
              </p>

              <button
                type="button"
                disabled={isTranslating}
                onClick={handleAutoTranslateToEnglish}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/25 cursor-pointer active:scale-95 shrink-0"
              >
                {isTranslating ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>
                  {isTranslating
                    ? lang === 'el'
                      ? 'Μετάφραση σε εξέλιξη...'
                      : 'Translating...'
                    : lang === 'el'
                    ? '⚡ Αυτόματη Μετάφραση στα Αγγλικά'
                    : '⚡ Auto-Translate to English'}
                </span>
              </button>
            </div>

            {translationNotification && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{translationNotification}</span>
              </div>
            )}
          </div>

          {/* Team Assignment */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
                  <span>🎯 {lang === 'el' ? 'Ανάθεση σε Ομάδες' : 'Team Assignment'}</span>
                  {isAllTeams && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {lang === 'el' ? 'Σε όλες' : 'All teams'}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isAllTeams
                    ? lang === 'el'
                      ? 'Η αποστολή θα εμφανιστεί στη λίστα όλων των ομάδων.'
                      : "The quest will appear on all teams' lists."
                    : `${lang === 'el' ? 'Ανατεθειμένη σε' : 'Assigned to'} ${assignedTeamIds.length}/${teams.length} ${
                        lang === 'el' ? 'ομάδες' : 'teams'
                      }`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleAllTeams}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isAllTeams
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {isAllTeams
                    ? lang === 'el'
                      ? '✓ Σε Όλες τις Ομάδες'
                      : '✓ All Teams'
                    : lang === 'el'
                    ? '🔄 Ανάθεση σε Όλες'
                    : '🔄 Assign to All'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
              {teams.map((tm) => {
                const checked = isTeamChecked(tm.id);
                return (
                  <button
                    key={tm.id}
                    type="button"
                    onClick={() => handleToggleTeam(tm.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all text-left cursor-pointer ${
                      checked
                        ? 'bg-slate-900 border-amber-500 text-amber-200 ring-1 ring-amber-500/30 font-bold'
                        : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base">{tm.avatar}</span>
                    <span className="truncate flex-1">{tm.name}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Type & Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'el' ? 'Τύπος Δραστηριότητας' : 'Activity Type'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="multiple_choice">{t.multiple_choice}</option>
                <option value="true_false">{t.true_false}</option>
                <option value="text_match">{t.text_match}</option>
                <option value="image_match">{t.image_match}</option>
                <option value="qr_scan">{t.qr_scan}</option>
                <option value="photo_upload">{t.photo_upload}</option>
                <option value="puzzle">{t.puzzle}</option>
                <option value="task">{t.task}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'el' ? 'Πόντοι' : 'Points'}
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                step="10"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono text-center focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Title (Greek / English) */}
          <div className="space-y-3">
            {(editorTab === 'both' || editorTab === 'el') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>🇬🇷 Τίτλος Αποστολής (Ελληνικά)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {editorTab === 'both' ? 'Ελληνικό Πρωτότυπο' : 'Βασικός Τίτλος'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="π.χ. Κουίζ: Το Αρχαίο Μνημείο"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {(editorTab === 'both' || editorTab === 'en') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>🇬🇧 Quest Title (English Translation)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800 font-normal">
                      Τελικό Editing
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isTranslating || isTranslatingField === 'title' || !title.trim()}
                      onClick={handleTranslateTitleOnly}
                      className="px-2 py-0.5 rounded-lg bg-sky-950/90 hover:bg-sky-900 border border-sky-500/50 text-sky-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                      title={lang === 'el' ? 'Μετάφραση του ελληνικού τίτλου στα Αγγλικά' : 'Translate Greek title to English'}
                    >
                      {isTranslatingField === 'title' ? (
                        <Loader2 className="w-3 h-3 animate-spin text-sky-300" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-300" />
                      )}
                      <span>{lang === 'el' ? '⚡ Μετάφραση Τίτλου' : '⚡ Translate Title'}</span>
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                      English Version
                    </span>
                  </div>
                </div>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. Photo Quiz: Ancient Monument"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-sky-600/70 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                />
              </div>
            )}
          </div>

          {/* Description & Instructions */}
          <div className="space-y-3">
            {(editorTab === 'both' || editorTab === 'el') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>🇬🇷 Περιγραφή & Οδηγίες (Ελληνικά)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Οδηγίες ομάδας</span>
                </div>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Οδηγίες εκτέλεσης της αποστολής..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {(editorTab === 'both' || editorTab === 'en') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>🇬🇧 Description & Instructions (English Translation)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800 font-normal">
                      Τελικό Editing
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isTranslating || isTranslatingField === 'description' || !description.trim()}
                      onClick={handleTranslateDescriptionOnly}
                      className="px-2 py-0.5 rounded-lg bg-sky-950/90 hover:bg-sky-900 border border-sky-500/50 text-sky-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                      title={lang === 'el' ? 'Μετάφραση της ελληνικής περιγραφής στα Αγγλικά' : 'Translate Greek description to English'}
                    >
                      {isTranslatingField === 'description' ? (
                        <Loader2 className="w-3 h-3 animate-spin text-sky-300" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-300" />
                      )}
                      <span>{lang === 'el' ? '⚡ Μετάφραση Περιγραφής' : '⚡ Translate Description'}</span>
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">English instructions</span>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="Instructions for the teams in English..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-sky-600/70 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                />
              </div>
            )}
          </div>

          {/* Photo Option: Explicit choice for with photo vs text-only without photo */}
          {type !== 'puzzle' && type !== 'text_match' && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    {lang === 'el' ? 'Φωτογραφία στην Ερώτηση / Αποστολή' : 'Photo in Quest'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {hasPhoto
                      ? imageUrl
                        ? lang === 'el'
                          ? '✓ Η αποστολή περιλαμβάνει επιλεγμένη φωτογραφία.'
                          : '✓ Quest includes a selected photo.'
                        : lang === 'el'
                        ? '⚠️ Επιλέξτε φωτογραφία από αρχείο, internet ή βιβλιοθήκη παρακάτω.'
                        : '⚠️ Select a photo below from file, URL or presets.'
                      : lang === 'el'
                      ? '— Χωρίς φωτογραφία (Μόνο κείμενο).'
                      : '— Text-only (No photo required).'}
                  </span>
                </div>

                <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setHasPhoto(false);
                      setImageUrl('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !hasPhoto
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'el' ? 'Χωρίς Φωτογραφία' : 'No Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasPhoto(true);
                      if (!imageUrl) {
                        setImageUrl(SVG_IMAGES.parthenon);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      hasPhoto
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'el' ? '+ Με Φωτογραφία' : '+ With Photo'}
                  </button>
                </div>
              </div>

              {hasPhoto && (
                <div className="pt-2 border-t border-slate-800/80">
                  <ImageSourcePicker
                    value={imageUrl}
                    onChange={(newUrl) => {
                      setImageUrl(newUrl);
                      if (newUrl) setHasPhoto(true);
                    }}
                    onClear={() => {
                      setImageUrl('');
                    }}
                    lang={lang}
                    label={
                      lang === 'el'
                        ? 'Επιλογή / Ανέβασμα Φωτογραφίας (Από αρχείο συσκευής, Web URL, Βιβλιοθήκη ή Κάμερα):'
                        : 'Select / Upload Photo (Device file, Web URL, Presets or Camera):'
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* ================= TYPE SPECIFIC FIELDS ================= */}

          {/* 1. MULTIPLE CHOICE */}
          {type === 'multiple_choice' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    {editorTab === 'el'
                      ? '🇬🇷 Επιλογές Απαντήσεων & Σημείωση Σωστών (Ελληνικά)'
                      : '🇬🇧 Answer Options Translation (English)'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {lang === 'el'
                      ? `Τσεκάρετε τα κουτάκια για τις σωστές επιλογές (${mcCorrectIndices.length} επιλεγμένες)`
                      : `Check boxes for correct answers (${mcCorrectIndices.length} selected)`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = mcOptions.length + 1;
                    setMcOptions([...mcOptions, `Επιλογή ${nextIdx}`]);
                    setMcOptionsEn([...mcOptionsEn, `Option ${nextIdx}`]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'el' ? 'Προσθήκη Επιλογής' : 'Add Option'}</span>
                </button>
              </div>

              {/* Status bar: Multiple vs Single Answers Notice */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between">
                <span className="text-slate-300">
                  {mcCorrectIndices.length > 1 ? (
                    <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {lang === 'el'
                          ? `Πολλαπλές σωστές απαντήσεις (${mcCorrectIndices.length} σωστές)`
                          : `Multiple correct answers (${mcCorrectIndices.length} correct)`}
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {lang === 'el'
                        ? 'Μία μοναδική σωστή απάντηση'
                        : 'Single correct answer'}
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {lang === 'el'
                    ? 'Τσεκάρετε όσες επιλογές είναι σωστές'
                    : 'Check any options that are correct'}
                </span>
              </div>

              <div className="space-y-2">
                {mcOptions.map((opt, idx) => {
                  const isChecked = mcCorrectIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all ${
                        isChecked
                          ? 'bg-slate-900/90 border-emerald-500/70 shadow-sm'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {/* Checkbox toggle button for marking correct answers */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            if (mcCorrectIndices.length > 1) {
                              setMcCorrectIndices(mcCorrectIndices.filter((i) => i !== idx));
                            }
                          } else {
                            setMcCorrectIndices([...mcCorrectIndices, idx].sort((a, b) => a - b));
                          }
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border font-mono text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md'
                            : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                        }`}
                        title={
                          isChecked
                            ? lang === 'el'
                              ? 'Σωστή Απάντηση (κλικ για αποεπιλογή)'
                              : 'Correct (click to uncheck)'
                            : lang === 'el'
                            ? 'Ορισμός ως Σωστή Απάντηση'
                            : 'Mark as Correct'
                        }
                      >
                        {isChecked ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          String.fromCharCode(65 + idx)
                        )}
                      </button>

                      {/* Text Input depending on active editor tab */}
                      <div className="flex-1 space-y-1.5">
                        {(editorTab === 'both' || editorTab === 'el') && (
                          <div className="flex items-center gap-1.5">
                            {editorTab === 'both' && (
                              <span className="text-[10px] font-bold text-amber-400 font-mono w-4 shrink-0">🇬🇷</span>
                            )}
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const next = [...mcOptions];
                                next[idx] = e.target.value;
                                setMcOptions(next);
                              }}
                              placeholder={`Επιλογή ${String.fromCharCode(65 + idx)}`}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        )}
                        {(editorTab === 'both' || editorTab === 'en') && (
                          <div className="flex items-center gap-1.5">
                            {editorTab === 'both' && (
                              <span className="text-[10px] font-bold text-sky-400 font-mono w-4 shrink-0">🇬🇧</span>
                            )}
                            <input
                              type="text"
                              value={mcOptionsEn[idx] || ''}
                              onChange={(e) => {
                                const next = [...mcOptionsEn];
                                next[idx] = e.target.value;
                                setMcOptionsEn(next);
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + idx)} (English Translation)`}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-sky-600/70 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                            />
                          </div>
                        )}
                      </div>

                      {/* Delete button if more than 2 options */}
                      {mcOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextOptions = mcOptions.filter((_, i) => i !== idx);
                            setMcOptions(nextOptions);
                            setMcOptionsEn(mcOptionsEn.filter((_, i) => i !== idx));
                            setMcCorrectIndices(
                              mcCorrectIndices
                                .filter((i) => i !== idx)
                                .map((i) => (i > idx ? i - 1 : i))
                            );
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Διαγραφή επιλογής"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. TRUE / FALSE */}
          {type === 'true_false' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">
                {lang === 'el' ? 'Σωστή Απάντηση' : 'Correct Answer'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTfCorrectVal(true)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    tfCorrectVal === true
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'el' ? 'ΣΩΣΤΟ (True)' : 'TRUE'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTfCorrectVal(false)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    tfCorrectVal === false
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <X className="w-4 h-4 text-rose-400" />
                  <span>{lang === 'el' ? 'ΛΑΘΟΣ (False)' : 'FALSE'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. TEXT MATCH */}
          {type === 'text_match' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    {editorTab === 'el'
                      ? '🇬🇷 Ζεύγη Αντιστοίχισης Κειμένου (Ελληνικά)'
                      : '🇬🇧 Text Matching Pairs Translation (English)'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {lang === 'el'
                      ? 'Ορίστε τα σωστά ζευγάρια (π.χ. Χώρα ↔ Πρωτεύουσα)'
                      : 'Define correct pairs (e.g. Country ↔ Capital)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const id = String(Date.now());
                    setTextPairs([...textPairs, { id, left: '', right: '' }]);
                    setTextPairsEn([...textPairsEn, { id, left: '', right: '' }]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'el' ? 'Προσθήκη Ζεύγους' : 'Add Pair'}</span>
                </button>
              </div>

              <div className="space-y-2">
                {textPairs.map((pair, idx) => (
                  <div key={pair.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{lang === 'el' ? `Ζεύγος #${idx + 1}` : `Pair #${idx + 1}`}</span>
                      {textPairs.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTextPairs(textPairs.filter((_, i) => i !== idx));
                            setTextPairsEn(textPairsEn.filter((_, i) => i !== idx));
                          }}
                          className="text-rose-400 hover:text-rose-300 text-xs cursor-pointer"
                        >
                          {lang === 'el' ? 'Διαγραφή' : 'Delete'}
                        </button>
                      )}
                    </div>

                    {editorTab === 'el' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Αριστερό στοιχείο (π.χ. Ελλάδα)"
                          value={pair.left}
                          onChange={(e) => {
                            const next = [...textPairs];
                            next[idx].left = e.target.value;
                            setTextPairs(next);
                          }}
                          className="p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                        />
                        <input
                          type="text"
                          placeholder="Δεξί ταίρι (π.χ. Αθήνα)"
                          value={pair.right}
                          onChange={(e) => {
                            const next = [...textPairs];
                            next[idx].right = e.target.value;
                            setTextPairs(next);
                          }}
                          className="p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 block truncate mb-1">
                            🇬🇷 {pair.left}
                          </span>
                          <input
                            type="text"
                            placeholder="Left element in English"
                            value={textPairsEn[idx]?.left || ''}
                            onChange={(e) => {
                              const next = [...textPairsEn];
                              if (!next[idx]) next[idx] = { id: pair.id, left: '', right: '' };
                              next[idx].left = e.target.value;
                              setTextPairsEn(next);
                            }}
                            className="w-full p-2 rounded-lg bg-slate-950 border border-sky-600/70 text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block truncate mb-1">
                            🇬🇷 {pair.right}
                          </span>
                          <input
                            type="text"
                            placeholder="Right match in English"
                            value={textPairsEn[idx]?.right || ''}
                            onChange={(e) => {
                              const next = [...textPairsEn];
                              if (!next[idx]) next[idx] = { id: pair.id, left: '', right: '' };
                              next[idx].right = e.target.value;
                              setTextPairsEn(next);
                            }}
                            className="w-full p-2 rounded-lg bg-slate-950 border border-sky-600/70 text-xs text-slate-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. IMAGE MATCH */}
          {type === 'image_match' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    {editorTab === 'el'
                      ? '🇬🇷 Ζεύγη Εικόνας με Κείμενο (Ελληνικά)'
                      : '🇬🇧 Image-to-Text Pairs Translation (English)'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {lang === 'el'
                      ? 'Συνδέστε κάθε εικόνα με την αντίστοιχη λεζάντα / περιγραφή'
                      : 'Connect each image with its label / description'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const id = String(Date.now());
                    setImagePairs([...imagePairs, { id, image: SVG_IMAGES.compass, text: '' }]);
                    setImagePairsEn([...imagePairsEn, { id, image: SVG_IMAGES.compass, text: '' }]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'el' ? 'Προσθήκη Εικόνας' : 'Add Image Pair'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {imagePairs.map((pair, idx) => (
                  <div key={pair.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{lang === 'el' ? `Ζεύγος #${idx + 1}` : `Pair #${idx + 1}`}</span>
                      {imagePairs.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setImagePairs(imagePairs.filter((_, i) => i !== idx));
                            setImagePairsEn(imagePairsEn.filter((_, i) => i !== idx));
                          }}
                          className="text-rose-400 hover:text-rose-300 text-xs cursor-pointer"
                        >
                          {lang === 'el' ? 'Διαγραφή' : 'Delete'}
                        </button>
                      )}
                    </div>
                    <ImageSourcePicker
                      value={pair.image}
                      onChange={(img) => {
                        const next = [...imagePairs];
                        next[idx].image = img;
                        setImagePairs(next);
                      }}
                      lang={lang}
                    />
                    {editorTab === 'el' ? (
                      <input
                        type="text"
                        placeholder={lang === 'el' ? 'Περιγραφή ή όνομα εικόνας' : 'Description or label'}
                        value={pair.text}
                        onChange={(e) => {
                          const next = [...imagePairs];
                          next[idx].text = e.target.value;
                          setImagePairs(next);
                        }}
                        className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      />
                    ) : (
                      <div>
                        <span className="text-[10px] text-slate-500 block truncate mb-1">
                          🇬🇷 {pair.text}
                        </span>
                        <input
                          type="text"
                          placeholder="Image label / description in English"
                          value={imagePairsEn[idx]?.text || ''}
                          onChange={(e) => {
                            const next = [...imagePairsEn];
                            if (!next[idx]) next[idx] = { ...pair, text: '' };
                            next[idx].text = e.target.value;
                            setImagePairsEn(next);
                          }}
                          className="w-full p-2 rounded-lg bg-slate-950 border border-sky-600/70 text-xs text-slate-200"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. QR CODE & UNLOCKED PHOTO / VIDEO */}
          {type === 'qr_scan' && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'el' ? 'Κωδικός Σταθμού QR (Target Code)' : 'Target Station Passcode'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={qrCodeTarget}
                    onChange={(e) => setQrCodeTarget(e.target.value)}
                    placeholder="π.χ. BOUND-QUEST-01"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 uppercase font-mono tracking-wider focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {lang === 'el'
                      ? 'Ο κωδικός που περιέχει το εκτυπωμένο QR code του σταθμού.'
                      : 'The code encoded in the station QR.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {editorTab === 'el'
                      ? '🇬🇷 Στοιχείο Εντοπισμού / Location Hint'
                      : '🇬🇧 Location Hint (English Translation)'}
                  </label>
                  {editorTab === 'el' ? (
                    <input
                      type="text"
                      value={qrHint}
                      onChange={(e) => setQrHint(e.target.value)}
                      placeholder="π.χ. Βρίσκεται κοντά στη βιβλιοθήκη..."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={qrHintEn}
                      onChange={(e) => setQrHintEn(e.target.value)}
                      placeholder="e.g. Located near the library..."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-sky-600/70 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                    />
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {lang === 'el'
                      ? 'Οδηγία για το πού να ψάξουν οι μαθητές.'
                      : 'Clue where players should look.'}
                  </p>
                </div>
              </div>

              {/* UNLOCKED MEDIA (PHOTO / VIDEO) SECTION */}
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {lang === 'el'
                          ? 'Ξεκλείδωμα Περιεχομένου κατά το Σκανάρισμα'
                          : 'Unlocked Media Upon Scanning'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {lang === 'el'
                        ? 'Ορίστε τη φωτογραφία ή το βίντεο που θα προβληθεί αυτόματα στην οθόνη του χρήστη μόλις σκανάρει το QR:'
                        : 'Choose the photo or video that automatically displays on the screen when the QR code is scanned:'}
                    </p>
                  </div>
                </div>

                {/* Media Type Toggle: Photo vs Video */}
                <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setQrMediaType('image')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      qrMediaType === 'image'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{lang === 'el' ? 'Φωτογραφία (Photo)' : 'Photo / Image'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrMediaType('video')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      qrMediaType === 'video'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>{lang === 'el' ? 'Βίντεο (Video)' : 'Video'}</span>
                  </button>
                </div>

                {/* Image Picker */}
                {qrMediaType === 'image' && (
                  <div className="space-y-2 pt-1">
                    <ImageSourcePicker
                      value={qrMediaUrl}
                      onChange={setQrMediaUrl}
                      onClear={() => setQrMediaUrl('')}
                      lang={lang}
                      label={
                        lang === 'el'
                          ? 'Επιλογή ή Ανέβασμα Φωτογραφίας'
                          : 'Select or Upload Photo'
                      }
                    />
                  </div>
                )}

                {/* Video Configuration */}
                {qrMediaType === 'video' && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {lang === 'el'
                          ? 'Σύνδεσμος Βίντεο (YouTube / Vimeo / MP4 URL)'
                          : 'Video URL (YouTube / Vimeo / MP4)'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={qrMediaUrl}
                          onChange={(e) => setQrMediaUrl(e.target.value)}
                          placeholder="π.χ. https://www.youtube.com/watch?v=... ή https://vimeo.com/..."
                          className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                        />
                        {qrMediaUrl && (
                          <button
                            type="button"
                            onClick={() => setQrMediaUrl('')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {lang === 'el'
                          ? 'Υποστηρίζονται σύνδεσμοι YouTube (κανονικά ή Shorts), Vimeo και απευθείας MP4.'
                          : 'Supports YouTube videos/shorts, Vimeo, and direct MP4 URLs.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Optional Media Title & Caption for the unlocked screen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      {editorTab === 'el'
                        ? '🇬🇷 Τίτλος Υλικού (Προαιρετικό)'
                        : '🇬🇧 Media Title (English)'}
                    </label>
                    {editorTab === 'el' ? (
                      <input
                        type="text"
                        value={qrMediaTitle}
                        onChange={(e) => setQrMediaTitle(e.target.value)}
                        placeholder="π.χ. Ιστορικός Χάρτης Αποστολής"
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                      />
                    ) : (
                      <input
                        type="text"
                        value={qrMediaTitleEn}
                        onChange={(e) => setQrMediaTitleEn(e.target.value)}
                        placeholder="e.g. Historical Mission Map"
                        className="w-full p-2 rounded-lg bg-slate-900 border border-sky-600/70 text-xs text-slate-200"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      {editorTab === 'el'
                        ? '🇬🇷 Λεζάντα / Μήνυμα (Προαιρετικό)'
                        : '🇬🇧 Caption / Clue Message (English)'}
                    </label>
                    {editorTab === 'el' ? (
                      <input
                        type="text"
                        value={qrMediaCaption}
                        onChange={(e) => setQrMediaCaption(e.target.value)}
                        placeholder="π.χ. Συγχαρητήρια! Μελετήστε τα στοιχεία..."
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                      />
                    ) : (
                      <input
                        type="text"
                        value={qrMediaCaptionEn}
                        onChange={(e) => setQrMediaCaptionEn(e.target.value)}
                        placeholder="e.g. Congratulations! Study the clues..."
                        className="w-full p-2 rounded-lg bg-slate-900 border border-sky-600/70 text-xs text-slate-200"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. PUZZLE */}
          {type === 'puzzle' && (
            <div className="space-y-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'el' ? 'Αριθμός Κομματιών Παζλ' : 'Puzzle Pieces Count'}
                </label>
                <div className="flex gap-2">
                  {([4, 6, 9] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setPuzzleGridSize(sz)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        puzzleGridSize === sz
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {sz} {lang === 'el' ? 'Κομμάτια' : 'Pieces'}
                    </button>
                  ))}
                </div>
              </div>

              <ImageSourcePicker
                value={puzzleImage}
                onChange={setPuzzleImage}
                lang={lang}
                label={
                  lang === 'el'
                    ? 'Εικόνα Παζλ (Ανέβασμα από αρχείο, internet URL ή βιβλιοθήκη)'
                    : 'Puzzle Image (Upload from file, web URL or presets)'
                }
              />
            </div>
          )}

          {/* 7. PHOTO UPLOAD MISSION */}
          {type === 'photo_upload' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {editorTab === 'el'
                    ? '🇬🇷 Οδηγίες Λήψης Φωτογραφίας προς τις ομάδες'
                    : '🇬🇧 Photo Instructions for Teams (English)'}
                </label>
                {editorTab === 'el' ? (
                  <textarea
                    rows={2}
                    value={photoInstructions}
                    onChange={(e) => setPhotoInstructions(e.target.value)}
                    placeholder="π.χ. Βγάλτε ομαδική φωτογραφία όπου όλα τα μέλη κρατούν ένα αντικείμενο..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                ) : (
                  <textarea
                    rows={2}
                    value={photoInstructionsEn}
                    onChange={(e) => setPhotoInstructionsEn(e.target.value)}
                    placeholder="e.g. Take a team photo holding an item..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-sky-600/70 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                  />
                )}
              </div>
            </div>
          )}

          {/* 8. MISSION / TASK */}
          {type === 'task' && (
            <div className="space-y-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {editorTab === 'el'
                    ? '🇬🇷 Οδηγίες Αποστολής Πεδίου'
                    : '🇬🇧 Field Mission Instructions (English)'}
                </label>
                {editorTab === 'el' ? (
                  <textarea
                    rows={2}
                    value={taskInstructions}
                    onChange={(e) => setTaskInstructions(e.target.value)}
                    placeholder="π.χ. Εκτελέστε τα 3 βήματα στο χώρο και καταγράψτε τα στοιχεία..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                ) : (
                  <textarea
                    rows={2}
                    value={taskInstructionsEn}
                    onChange={(e) => setTaskInstructionsEn(e.target.value)}
                    placeholder="e.g. Execute the 3 steps on site and record the evidence..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-sky-600/70 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                  />
                )}
              </div>

              {/* Checklist steps */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    {editorTab === 'el'
                      ? '🇬🇷 Βήματα Ελέγχου (Checklist)'
                      : '🇬🇧 Checklist Steps (English Translation)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextNum = taskChecklist.length + 1;
                      setTaskChecklist([...taskChecklist, `Βήμα ${nextNum}: `]);
                      setTaskChecklistEn([...taskChecklistEn, `Step ${nextNum}: `]);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium cursor-pointer"
                  >
                    + {lang === 'el' ? 'Βήμα' : 'Step'}
                  </button>
                </div>

                <div className="space-y-1.5">
                  {taskChecklist.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="w-5 h-5 rounded-md bg-slate-900 text-slate-400 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </span>
                      {editorTab === 'el' ? (
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const next = [...taskChecklist];
                            next[idx] = e.target.value;
                            setTaskChecklist(next);
                          }}
                          className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      ) : (
                        <input
                          type="text"
                          value={taskChecklistEn[idx] || ''}
                          onChange={(e) => {
                            const next = [...taskChecklistEn];
                            next[idx] = e.target.value;
                            setTaskChecklistEn(next);
                          }}
                          placeholder={`Step ${idx + 1} in English`}
                          className="flex-1 p-2 rounded-lg bg-slate-900 border border-sky-600/70 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                        />
                      )}
                      {taskChecklist.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTaskChecklist(taskChecklist.filter((_, i) => i !== idx));
                            setTaskChecklistEn(taskChecklistEn.filter((_, i) => i !== idx));
                          }}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Requirement */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'el' ? 'Απαιτούμενο Αποδεικτικό Ολοκλήρωσης' : 'Evidence Required'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'text', label: lang === 'el' ? 'Μόνο Κείμενο' : 'Text Only', icon: <FileText className="w-3.5 h-3.5 text-cyan-400" /> },
                    { id: 'photo', label: lang === 'el' ? 'Μόνο Φωτογραφία' : 'Photo Only', icon: <Camera className="w-3.5 h-3.5 text-emerald-400" /> },
                    { id: 'both', label: lang === 'el' ? 'Κείμενο & Φωτό' : 'Both Text & Photo', icon: <Target className="w-3.5 h-3.5 text-amber-400" /> },
                    { id: 'confirmation_only', label: lang === 'el' ? 'Μόνο Τικ Ολοκλήρωσης' : 'Checkbox Only', icon: <ListChecks className="w-3.5 h-3.5 text-purple-400" /> }
                  ].map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setTaskEvidence(ev.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all text-left cursor-pointer ${
                        taskEvidence === ev.id
                          ? 'bg-amber-500/10 border-amber-500 text-slate-100 ring-1 ring-amber-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {ev.icon}
                      <span className="leading-snug">{ev.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt for Report Text if text required */}
              {(taskEvidence === 'text' || taskEvidence === 'both') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {editorTab === 'el'
                      ? '🇬🇷 Προτροπή / Τίτλος Αναφοράς (Προαιρετικό)'
                      : '🇬🇧 Report Prompt / Label (English)'}
                  </label>
                  {editorTab === 'el' ? (
                    <input
                      type="text"
                      value={taskPrompt}
                      onChange={(e) => setTaskPrompt(e.target.value)}
                      placeholder="π.χ. Καταγράψτε 2 επιχειρήματα που βρήκατε..."
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={taskPromptEn}
                      onChange={(e) => setTaskPromptEn(e.target.value)}
                      placeholder="e.g. Note down 2 arguments you discovered..."
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-sky-600/70 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Explanation / Post-answer Feedback (Greek / English) */}
          <div className="space-y-3">
            {(editorTab === 'both' || editorTab === 'el') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>🇬🇷 Επεξήγηση / Feedback Μετά την Απάντηση (Ελληνικά)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Εμφανίζεται μετά τη λύση</span>
                </div>
                <input
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="π.χ. Η σωστή απάντηση είναι..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {(editorTab === 'both' || editorTab === 'en') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>🇬🇧 Post-answer Explanation / Notes (English Translation)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isTranslating || isTranslatingField === 'explanation' || !explanation.trim()}
                      onClick={handleTranslateExplanationOnly}
                      className="px-2 py-0.5 rounded-lg bg-sky-950/90 hover:bg-sky-900 border border-sky-500/50 text-sky-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                      title={lang === 'el' ? 'Μετάφραση της επεξήγησης στα Αγγλικά' : 'Translate explanation to English'}
                    >
                      {isTranslatingField === 'explanation' ? (
                        <Loader2 className="w-3 h-3 animate-spin text-sky-300" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-300" />
                      )}
                      <span>{lang === 'el' ? '⚡ Μετάφραση' : '⚡ Translate'}</span>
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Shown after solving</span>
                  </div>
                </div>
                <input
                  type="text"
                  value={explanationEn}
                  onChange={(e) => setExplanationEn(e.target.value)}
                  placeholder="e.g. The correct fact is..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-sky-600/70 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md sticky bottom-0 z-20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />}
            <span>
              {isSubmitting
                ? lang === 'el'
                  ? '⏳ Αποθήκευση & Μετάφραση...'
                  : '⏳ Saving & Translating...'
                : t.save}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
