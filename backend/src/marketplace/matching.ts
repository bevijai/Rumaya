import type { HelperLocationType, HelperProfile, HelperSkill } from '@prisma/client';

const PROFICIENCY_RANK = { basic: 1, intermediate: 2, advanced: 3 } as const;

export interface MatchRequirements {
  requiredSkills: Array<{
    type: HelperSkill['type'];
    required: boolean;
    minimumProficiency?: HelperSkill['proficiency'];
  }>;
  preferredLanguages: string[];
  preferredLocationType?: HelperLocationType;
  preferredStartDate?: Date;
  minimumSalary?: number;
  maximumSalary?: number;
}

export interface MatchResult {
  level: 'strong' | 'good' | 'possible';
  reasons: string[];
  unmetRequirements: string[];
  internalScore: number;
}

type MatchableProfile = HelperProfile & { skills: HelperSkill[] };

export function calculateMatch(
  profile: MatchableProfile,
  requirements: MatchRequirements,
): MatchResult {
  const reasons: string[] = [];
  const unmetRequirements: string[] = [];
  let score = 0;

  const requestedSkills = requirements.requiredSkills;
  if (requestedSkills.length === 0) {
    score += 50;
  } else {
    const pointsPerSkill = 50 / requestedSkills.length;
    for (const requested of requestedSkills) {
      const skill = profile.skills.find((candidate) => candidate.type === requested.type);
      const meetsProficiency =
        skill &&
        (!requested.minimumProficiency ||
          PROFICIENCY_RANK[skill.proficiency] >= PROFICIENCY_RANK[requested.minimumProficiency]);
      if (meetsProficiency) {
        score += pointsPerSkill;
        reasons.push(`Matches ${requested.type.replaceAll('_', ' ')} needs`);
      } else if (requested.required) {
        unmetRequirements.push(requested.type.replaceAll('_', ' '));
      }
    }
  }

  const profileLanguages = Array.isArray(profile.languages)
    ? profile.languages.filter((language): language is string => typeof language === 'string')
    : [];
  if (requirements.preferredLanguages.length === 0) {
    score += 15;
  } else {
    const matchedLanguages = requirements.preferredLanguages.filter((language) =>
      profileLanguages.includes(language),
    );
    score += 15 * (matchedLanguages.length / requirements.preferredLanguages.length);
    if (matchedLanguages.length) reasons.push('Speaks a preferred language');
  }

  if (!requirements.preferredLocationType || profile.locationType === requirements.preferredLocationType) {
    score += 15;
    if (requirements.preferredLocationType) reasons.push('Matches preferred availability type');
  }

  if (!requirements.preferredStartDate) {
    score += 10;
  } else if (profile.availableFrom && profile.availableFrom <= requirements.preferredStartDate) {
    score += 10;
    reasons.push('Available by the preferred start date');
  }

  const expectedSalary = profile.expectedSalary ? Number(profile.expectedSalary) : undefined;
  const salaryFits =
    expectedSalary === undefined ||
    ((requirements.minimumSalary === undefined || expectedSalary >= requirements.minimumSalary) &&
      (requirements.maximumSalary === undefined || expectedSalary <= requirements.maximumSalary));
  if (salaryFits) {
    score += 10;
    if (expectedSalary !== undefined) reasons.push('Within the preferred salary range');
  }

  const normalizedScore = Math.round(score);
  const level =
    unmetRequirements.length > 0
      ? 'possible'
      : normalizedScore >= 80
        ? 'strong'
        : normalizedScore >= 60
          ? 'good'
          : 'possible';

  return { level, reasons, unmetRequirements, internalScore: normalizedScore };
}
