export function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0
  
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1, str2) {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

export function normalizeName(name) {
  if (!name) return ''
  
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function extractNameParts(name) {
  const parts = name.trim().split(/\s+/)
  return {
    first: parts[0] || '',
    last: parts[parts.length - 1] || '',
    middle: parts.slice(1, -1).join(' ') || ''
  }
}

export function findBestMatch(mttaName, existingOpponents, threshold = 0.7, teamName = null) {
  const normalizedMTTA = normalizeName(mttaName)
  const mttaParts = extractNameParts(mttaName)
  
  let bestMatch = null
  let bestScore = 0
  
  let candidates = existingOpponents
  
  if (teamName) {
    const normalizedTeamName = normalizeName(teamName)
    candidates = existingOpponents.filter(opponent => {
      if (!opponent.club) return false
      const normalizedClub = normalizeName(opponent.club)
      return normalizedClub === normalizedTeamName || 
             normalizedClub.includes(normalizedTeamName) || 
             normalizedTeamName.includes(normalizedClub)
    })
    
    if (candidates.length === 0) {
      candidates = existingOpponents
    }
  }
  
  for (const opponent of candidates) {
    const normalizedOpponent = normalizeName(opponent.name)
    const opponentParts = extractNameParts(opponent.name)
    
    let score = 0
    let teamBonus = 0
    
    if (teamName && opponent.club) {
      const normalizedTeamName = normalizeName(teamName)
      const normalizedClub = normalizeName(opponent.club)
      if (normalizedClub === normalizedTeamName) {
        teamBonus = 0.15
      } else if (normalizedClub.includes(normalizedTeamName) || normalizedTeamName.includes(normalizedClub)) {
        teamBonus = 0.1
      }
    }
    
    const lastNameMatch = mttaParts.last && opponentParts.last && 
      calculateSimilarity(mttaParts.last, opponentParts.last)
    
    const firstNameVariationMatch = checkCommonNameVariations(mttaParts.first, opponentParts.first)
    const lastNameExactMatch = mttaParts.last && opponentParts.last && 
      mttaParts.last.toLowerCase() === opponentParts.last.toLowerCase()
    
    if (lastNameExactMatch && firstNameVariationMatch) {
      score = 0.95 + teamBonus
    } else if (firstNameVariationMatch) {
      score = 0.7 + teamBonus
    }
    
    const fullNameSimilarity = calculateSimilarity(normalizedMTTA, normalizedOpponent)
    score = Math.max(score, fullNameSimilarity + teamBonus)
    
    if (lastNameMatch > 0.8) {
      const firstNameSimilarity = calculateSimilarity(mttaParts.first, opponentParts.first)
      const combinedScore = (lastNameMatch * 0.6) + (firstNameSimilarity * 0.4) + teamBonus
      score = Math.max(score, combinedScore)
    }
    
    if (score > bestScore && score >= threshold) {
      bestScore = score
      bestMatch = {
        opponent,
        score,
        reason: getMatchReason(mttaName, opponent.name, mttaParts, opponentParts, teamName, opponent.club)
      }
    }
  }
  
  return bestMatch
}

function getMatchReason(mttaName, opponentName, mttaParts, opponentParts, teamName = null, opponentClub = null) {
  const reasons = []
  
  if (teamName && opponentClub) {
    const normalizedTeamName = normalizeName(teamName)
    const normalizedClub = normalizeName(opponentClub)
    if (normalizedClub === normalizedTeamName) {
      reasons.push('Same team')
    } else if (normalizedClub.includes(normalizedTeamName) || normalizedTeamName.includes(normalizedClub)) {
      reasons.push('Similar team')
    }
  }
  
  if (checkCommonNameVariations(mttaParts.first, opponentParts.first)) {
    if (mttaParts.last && opponentParts.last && 
        mttaParts.last.toLowerCase() === opponentParts.last.toLowerCase()) {
      reasons.push('Same last name and known name variation (e.g., Spiros/Spyridon)')
    } else {
      reasons.push('Known name variation')
    }
  } else if (mttaParts.last && opponentParts.last && 
      mttaParts.last.toLowerCase() === opponentParts.last.toLowerCase()) {
    if (calculateSimilarity(mttaParts.first, opponentParts.first) > 0.6) {
      reasons.push('Same last name and similar first name')
    } else {
      reasons.push('Same last name')
    }
  } else {
    reasons.push('Similar name')
  }
  
  return reasons.join('; ')
}

export function checkCommonNameVariations(name1, name2) {
  const variations = {
    'spiros': ['spyridon', 'spyros'],
    'spyridon': ['spiros', 'spyros'],
    'spyros': ['spiros', 'spyridon'],
    'mike': ['michael'],
    'michael': ['mike'],
    'bob': ['robert'],
    'robert': ['bob'],
    'bill': ['william'],
    'william': ['bill'],
    'jim': ['james'],
    'james': ['jim'],
    'nick': ['nicholas', 'nicolas'],
    'nicholas': ['nick', 'nicolas'],
    'nicolas': ['nick', 'nicholas']
  }
  
  const name1Lower = normalizeName(name1)
  const name2Lower = normalizeName(name2)
  
  for (const [key, variants] of Object.entries(variations)) {
    if (name1Lower.includes(key) && variants.some(v => name2Lower.includes(v))) {
      return true
    }
    if (name2Lower.includes(key) && variants.some(v => name1Lower.includes(v))) {
      return true
    }
  }
  
  return false
}
