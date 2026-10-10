import type {
  AgencyRepresentation,
  HelperProfile,
  HelperSkill,
  Prisma,
  ProfileDocument,
  ProfileValidation,
} from '@prisma/client';

export interface ScoreBreakdown {
  identityPoints: number;
  skillsPoints: number;
  referencesPoints: number;
  readinessPoints: number;
  completenessPoints: number;
  totalPoints: number;
  evidence: Prisma.InputJsonObject;
}

type ScorableProfile = HelperProfile & {
  skills: HelperSkill[];
  documents: ProfileDocument[];
  validations: ProfileValidation[];
  representations: AgencyRepresentation[];
};

export const SCORE_CAPS = {
  identityPoints: 30,
  skillsPoints: 30,
  referencesPoints: 20,
  readinessPoints: 15,
  completenessPoints: 5,
} as const;

export function calculateProfileScore(profile: ScorableProfile): ScoreBreakdown {
  const verifiedDocuments = profile.documents.filter((document) => document.status === 'verified');
  const hasPassport = verifiedDocuments.some((document) => document.type === 'passport');
  const hasIdentity = verifiedDocuments.some((document) => document.type === 'identity');
  const verifiedReferences = verifiedDocuments.filter((document) => document.type === 'reference').length;
  const verifiedSkills = profile.skills.filter((skill) => skill.verified).length;
  const passedValidation = profile.validations.some((validation) => validation.outcome === 'passed');
  const hasAcceptedRepresentation = profile.representations.some(
    (representation) => representation.status === 'accepted',
  );
  const hasExpiredDocument = profile.documents.some(
    (document) =>
      document.status === 'expired' ||
      (document.expiresAt !== null && document.expiresAt.getTime() < Date.now()),
  );

  const identityPoints = (hasPassport ? 15 : 0) + (hasIdentity ? 15 : 0);
  const skillsPoints = Math.min(18, verifiedSkills * 3) + Math.min(12, profile.yearsExperience * 2);
  const referencesPoints = Math.min(10, verifiedReferences * 5) + (passedValidation ? 10 : 0);
  const readinessPoints =
    (profile.availableFrom ? 5 : 0) +
    (hasAcceptedRepresentation ? 5 : 0) +
    (profile.documents.length > 0 && !hasExpiredDocument ? 5 : 0);
  const completenessPoints =
    (profile.bio ? 1 : 0) +
    (Array.isArray(profile.languages) && profile.languages.length > 0 ? 1 : 0) +
    (profile.skills.length > 0 ? 1 : 0) +
    (profile.introductionVerifiedAt ? 2 : 0);

  return {
    identityPoints,
    skillsPoints,
    referencesPoints,
    readinessPoints,
    completenessPoints,
    totalPoints:
      identityPoints + skillsPoints + referencesPoints + readinessPoints + completenessPoints,
    evidence: {
      hasPassport,
      hasIdentity,
      verifiedReferences,
      verifiedSkills,
      yearsExperience: profile.yearsExperience,
      passedValidation,
      hasAcceptedRepresentation,
      hasExpiredDocument,
      hasIntroduction: Boolean(profile.introductionVerifiedAt),
    },
  };
}
