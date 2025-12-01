import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { useMatchesStore } from './matches'
import { useTournamentsStore } from './tournaments'
import { useOpponentsStore } from './opponents'

export const useStreaksStore = defineStore('streaks', () => {
  const milestones = ref([])
  const loading = ref(false)
  const matchesStore = useMatchesStore()
  const tournamentsStore = useTournamentsStore()
  const opponentsStore = useOpponentsStore()
  
  const PLAYER_NAME = 'Spiros Stampoulis'

  const fetchMilestones = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'milestones'), orderBy('date', 'desc'))
      const querySnapshot = await getDocs(q)
      milestones.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      }))
    } catch (error) {
      console.error('Error fetching milestones:', error)
    } finally {
      loading.value = false
    }
  }

  const addMilestone = async (milestoneData) => {
    try {
      const docRef = await addDoc(collection(db, 'milestones'), {
        ...milestoneData,
        date: Timestamp.now(),
        createdAt: Timestamp.now()
      })
      await fetchMilestones()
      return docRef.id
    } catch (error) {
      console.error('Error adding milestone:', error)
      throw error
    }
  }

  const deleteMilestone = async (id) => {
    try {
      await deleteDoc(doc(db, 'milestones', id))
      await fetchMilestones()
    } catch (error) {
      console.error('Error deleting milestone:', error)
      throw error
    }
  }

  const currentWinStreak = computed(() => {
    const sortedMatches = [...matchesStore.matches]
      .filter(m => m.date && m.scores && m.scores.length > 0)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateB - dateA
      })

    if (sortedMatches.length === 0) return 0

    let streak = 0
    for (const match of sortedMatches) {
      const myTotal = match.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = match.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      
      if (myTotal > oppTotal) {
        streak++
      } else {
        break
      }
    }

    return streak
  })

  const currentLossStreak = computed(() => {
    const sortedMatches = [...matchesStore.matches]
      .filter(m => m.date && m.scores && m.scores.length > 0)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateB - dateA
      })

    if (sortedMatches.length === 0) return 0

    let streak = 0
    for (const match of sortedMatches) {
      const myTotal = match.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = match.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      
      if (oppTotal > myTotal) {
        streak++
      } else {
        break
      }
    }

    return streak
  })

  const longestWinStreak = computed(() => {
    const sortedMatches = [...matchesStore.matches]
      .filter(m => m.date && m.scores && m.scores.length > 0)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateA - dateB
      })

    let maxStreak = 0
    let currentStreak = 0

    for (const match of sortedMatches) {
      const myTotal = match.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = match.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      
      if (myTotal > oppTotal) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    return maxStreak
  })

  const longestLossStreak = computed(() => {
    const sortedMatches = [...matchesStore.matches]
      .filter(m => m.date && m.scores && m.scores.length > 0)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateA - dateB
      })

    let maxStreak = 0
    let currentStreak = 0

    for (const match of sortedMatches) {
      const myTotal = match.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = match.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      
      if (oppTotal > myTotal) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    return maxStreak
  })

  const personalRecords = computed(() => {
    const matches = matchesStore.matches.filter(m => m.date && m.scores && m.scores.length > 0)
    
    if (matches.length === 0) {
      return {
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        bestTournamentFinish: null,
        mostConsecutiveWins: longestWinStreak.value,
        mostConsecutiveLosses: longestLossStreak.value
      }
    }

    const wins = matches.filter(m => {
      const myTotal = m.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = m.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      return myTotal > oppTotal
    }).length

    const losses = matches.length - wins

    return {
      totalMatches: matches.length,
      totalWins: wins,
      totalLosses: losses,
      mostConsecutiveWins: longestWinStreak.value,
      mostConsecutiveLosses: longestLossStreak.value,
      currentWinStreak: currentWinStreak.value,
      currentLossStreak: currentLossStreak.value
    }
  })

  const checkMilestones = async () => {
    await matchesStore.fetchMatches()
    await fetchMilestones()
    
    const records = personalRecords.value
    const newMilestones = []

    if (records.totalMatches === 10 || records.totalMatches === 25 || 
        records.totalMatches === 50 || records.totalMatches === 100 || 
        records.totalMatches === 200) {
      newMilestones.push({
        type: 'matches',
        title: `${records.totalMatches} Matches Played`,
        description: `You've played ${records.totalMatches} matches!`,
        category: 'milestone'
      })
    }

    if (records.totalWins === 10 || records.totalWins === 25 || 
        records.totalWins === 50 || records.totalWins === 100) {
      newMilestones.push({
        type: 'wins',
        title: `${records.totalWins} Wins Achieved`,
        description: `Congratulations on ${records.totalWins} wins!`,
        category: 'achievement'
      })
    }

    if (currentWinStreak.value === 5 || currentWinStreak.value === 10 || 
        currentWinStreak.value === 15) {
      newMilestones.push({
        type: 'streak',
        title: `${currentWinStreak.value} Match Win Streak`,
        description: `You're on fire with ${currentWinStreak.value} consecutive wins!`,
        category: 'achievement'
      })
    }

    if (longestWinStreak.value === 5 || longestWinStreak.value === 10 || 
        longestWinStreak.value === 15 || longestWinStreak.value === 20) {
      const existing = milestones.value.find(m => 
        m.type === 'longest_streak' && m.value === longestWinStreak.value
      )
      if (!existing) {
        newMilestones.push({
          type: 'longest_streak',
          title: `Longest Win Streak: ${longestWinStreak.value}`,
          description: `Your longest winning streak is ${longestWinStreak.value} matches!`,
          category: 'record',
          value: longestWinStreak.value
        })
      }
    }

    await checkTournamentGroupTop4()
    await checkTournamentFinalWins()
    await checkTournamentKnockoutStage()

    for (const milestone of newMilestones) {
      const exists = milestones.value.some(m => 
        m.type === milestone.type && 
        m.title === milestone.title &&
        Math.abs((m.date?.getTime() || 0) - Date.now()) < 86400000
      )
      
      if (!exists) {
        await addMilestone(milestone)
      }
    }
  }

  const getGroupStandings = (tournamentId, group) => {
    const groupMatches = matchesStore.matches.filter(m => 
      m.tournamentId === tournamentId &&
      m.round === `Group ${group.name}`
    )
    
    const playerIds = group.players || []
    const stats = {}
    
    playerIds.forEach(playerId => {
      stats[playerId] = {
        id: playerId,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0
      }
    })
    
    groupMatches.forEach(match => {
      if (!match.scores || match.scores.length === 0) return
      
      let player1Sets = 0
      let player2Sets = 0
      
      match.scores.forEach(score => {
        const p1Score = score.player1Score || score.myScore || 0
        const p2Score = score.player2Score || score.oppScore || 0
        if (p1Score && p2Score) {
          if (p1Score > p2Score) player1Sets++
          else if (p2Score > p1Score) player2Sets++
        }
      })
      
      const p1Id = match.player1Id
      const p2Id = match.player2Id
      
      if (stats[p1Id]) {
        stats[p1Id].played++
        stats[p1Id].setsWon += player1Sets
        stats[p1Id].setsLost += player2Sets
        if (player1Sets > player2Sets) {
          stats[p1Id].won++
          stats[p1Id].points += 3
        } else {
          stats[p1Id].lost++
        }
      }
      
      if (stats[p2Id]) {
        stats[p2Id].played++
        stats[p2Id].setsWon += player2Sets
        stats[p2Id].setsLost += player1Sets
        if (player2Sets > player1Sets) {
          stats[p2Id].won++
          stats[p2Id].points += 3
        } else {
          stats[p2Id].lost++
        }
      }
    })
    
    return Object.values(stats)
      .map(p => ({
        ...p,
        setDifference: p.setsWon - p.setsLost
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return b.setDifference - a.setDifference
      })
  }

  const hasScheduledMatches = (tournamentId) => {
    const tournamentMatches = matchesStore.matches.filter(m => m.tournamentId === tournamentId)
    return tournamentMatches.some(m => {
      if (!m.scores || m.scores.length === 0) return true
      const hasScores = m.scores.some(s => (s.player1Score || s.myScore) && (s.player2Score || s.oppScore))
      return !hasScores
    })
  }

  const checkTournamentGroupTop4 = async () => {
    await tournamentsStore.fetchTournaments()
    await opponentsStore.fetchOpponents()
    await matchesStore.fetchMatches()
    await fetchMilestones()
    
    const currentPlayer = opponentsStore.opponents.find(o => o.name === PLAYER_NAME)
    if (!currentPlayer) {
      return
    }
    
    const tournaments = tournamentsStore.tournaments.filter(t => 
      t.type === 'Tournament' && t.groups && Array.isArray(t.groups) && t.groups.length > 0
    )
    
    for (const tournament of tournaments) {
      if (hasScheduledMatches(tournament.id)) {
        continue
      }
      
      for (const group of tournament.groups) {
        const standings = getGroupStandings(tournament.id, group)
        
        if (standings.length === 0) continue
        
        const playerIndex = standings.findIndex(p => p.id === currentPlayer.id)
        
        if (playerIndex !== -1 && playerIndex < 4) {
          const position = playerIndex + 1
          
          const groupMatches = matchesStore.matches.filter(m => 
            m.tournamentId === tournament.id &&
            m.round === `Group ${group.name}` &&
            (m.player1Id === currentPlayer.id || m.player2Id === currentPlayer.id) &&
            m.scores &&
            m.scores.length > 0
          )
          
          let achievementDate = new Date()
          if (groupMatches.length > 0) {
            const matchDates = groupMatches
              .map(m => {
                if (!m.date) return null
                if (m.date instanceof Date) return m.date
                if (m.date?.toDate && typeof m.date.toDate === 'function') return m.date.toDate()
                return new Date(m.date)
              })
              .filter(d => d !== null && !isNaN(d.getTime()))
              .sort((a, b) => b - a)
            
            if (matchDates.length > 0) {
              achievementDate = matchDates[0]
            }
          }
          
          await fetchMilestones()
          const existing = milestones.value.find(m => 
            m.type === 'tournament_top4' &&
            m.tournamentId === tournament.id &&
            m.groupName === group.name &&
            m.playerId === currentPlayer.id &&
            m.position === position
          )
          
          if (existing) {
            const existingDate = existing.date instanceof Date ? existing.date : (existing.date?.toDate ? existing.date.toDate() : new Date(existing.date))
            const dateDiff = Math.abs(achievementDate.getTime() - existingDate.getTime())
            const oneDay = 24 * 60 * 60 * 1000
            
            if (dateDiff > oneDay) {
              const docRef = doc(db, 'milestones', existing.id)
              await updateDoc(docRef, {
                date: Timestamp.fromDate(achievementDate)
              })
              await fetchMilestones()
            }
            continue
          }
          
          const tournamentName = tournament.name
          const groupName = group.name
          const positionText = position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : '4th'
          
          await addDoc(collection(db, 'milestones'), {
            type: 'tournament_top4',
            title: `Top ${position} in ${tournamentName} - Group ${groupName}`,
            description: `Finished ${positionText} place in Group ${groupName} of ${tournamentName}`,
            category: 'achievement',
            tournamentId: tournament.id,
            tournamentName: tournamentName,
            groupName: groupName,
            playerId: currentPlayer.id,
            position: position,
            date: Timestamp.fromDate(achievementDate),
            createdAt: Timestamp.now()
          })
          await fetchMilestones()
        }
      }
    }
  }

  const getMatchWinner = (match) => {
    if (!match.scores || match.scores.length === 0) return null
    
    let player1Sets = 0
    let player2Sets = 0
    
    match.scores.forEach(score => {
      const p1Score = score.player1Score || score.myScore || 0
      const p2Score = score.player2Score || score.oppScore || 0
      if (p1Score && p2Score) {
        if (p1Score > p2Score) player1Sets++
        else if (p2Score > p1Score) player2Sets++
      }
    })
    
    if (player1Sets === player2Sets) return null
    return player1Sets > player2Sets ? match.player1Id : match.player2Id
  }

  const checkTournamentFinalWins = async () => {
    await tournamentsStore.fetchTournaments()
    await opponentsStore.fetchOpponents()
    await matchesStore.fetchMatches()
    await fetchMilestones()
    
    const currentPlayer = opponentsStore.opponents.find(o => o.name === PLAYER_NAME)
    if (!currentPlayer) {
      return
    }
    
    const finalMatches = matchesStore.matches.filter(m => 
      m.round === 'Final' && 
      m.scores && 
      m.scores.length > 0 &&
      (m.player1Id === currentPlayer.id || m.player2Id === currentPlayer.id)
    )
    
    for (const finalMatch of finalMatches) {
      const tournament = tournamentsStore.tournaments.find(t => t.id === finalMatch.tournamentId)
      if (!tournament) continue
      
      if (hasScheduledMatches(tournament.id)) {
        continue
      }
      
      const winner = getMatchWinner(finalMatch)
      
      if (winner === currentPlayer.id) {
        let achievementDate = new Date()
        if (finalMatch.date) {
          if (finalMatch.date instanceof Date) {
            achievementDate = finalMatch.date
          } else if (finalMatch.date?.toDate && typeof finalMatch.date.toDate === 'function') {
            achievementDate = finalMatch.date.toDate()
          } else if (finalMatch.date) {
            achievementDate = new Date(finalMatch.date)
          }
        }
        
        await fetchMilestones()
        const existing = milestones.value.find(m => 
          m.type === 'tournament_final_win' &&
          m.tournamentId === tournament.id &&
          m.playerId === currentPlayer.id
        )
        
        if (existing) {
          const existingDate = existing.date instanceof Date ? existing.date : (existing.date?.toDate ? existing.date.toDate() : new Date(existing.date))
          const dateDiff = Math.abs(achievementDate.getTime() - existingDate.getTime())
          const oneDay = 24 * 60 * 60 * 1000
          
          if (dateDiff > oneDay) {
            const docRef = doc(db, 'milestones', existing.id)
            await updateDoc(docRef, {
              date: Timestamp.fromDate(achievementDate)
            })
            await fetchMilestones()
          }
          continue
        }
        
        const tournamentName = tournament.name || 'Tournament'
        await addDoc(collection(db, 'milestones'), {
        type: 'tournament_final_win',
        title: `Tournament Champion: ${tournamentName}`,
        description: `Won the final of ${tournamentName}!`,
        category: 'achievement',
        tournamentId: tournament.id,
        tournamentName: tournamentName,
        playerId: currentPlayer.id,
        date: Timestamp.fromDate(achievementDate),
        createdAt: Timestamp.now()
      })
      await fetchMilestones()
      }
    }
  }

  const checkTournamentKnockoutStage = async () => {
    await tournamentsStore.fetchTournaments()
    await opponentsStore.fetchOpponents()
    await matchesStore.fetchMatches()
    await fetchMilestones()
    
    const normalizeName = (name) => name.toLowerCase().trim().replace(/\s+/g, ' ')
    const playerNameVariations = [
      PLAYER_NAME,
      'stampoulis spiros',
      'spiros stampoulis',
      'Spiros Stampoulis'
    ]
    
    const currentPlayer = opponentsStore.opponents.find(o => {
      const normalizedPlayerName = normalizeName(o.name)
      return playerNameVariations.some(variant => 
        normalizeName(variant) === normalizedPlayerName
      )
    })
    
    if (!currentPlayer) {
      return
    }
    
    const knockoutRounds = ['Quarter-Final', 'Semi-Final', 'Final']
    const roundOrder = { 'Quarter-Final': 1, 'Semi-Final': 2, 'Final': 3 }
    
    const tournaments = tournamentsStore.tournaments.filter(t => 
      t.type === 'Tournament' && !hasScheduledMatches(t.id)
    )
    
    for (const tournament of tournaments) {
      const tournamentMatches = matchesStore.matches.filter(m => 
        m.tournamentId === tournament.id &&
        m.round &&
        knockoutRounds.includes(m.round) &&
        (m.player1Id === currentPlayer.id || m.player2Id === currentPlayer.id) &&
        m.scores &&
        m.scores.length > 0
      )
      
      if (tournamentMatches.length === 0) continue
      
      const roundsReached = tournamentMatches.map(m => m.round)
      const highestRound = roundsReached.reduce((highest, round) => {
        return roundOrder[round] > roundOrder[highest] ? round : highest
      }, roundsReached[0])
      
      const achievementTypes = {
        'Quarter-Final': 'tournament_quarter_final',
        'Semi-Final': 'tournament_semi_final',
        'Final': 'tournament_final_reached'
      }
      
      const achievementTitles = {
        'Quarter-Final': 'Quarter-Finalist',
        'Semi-Final': 'Semi-Finalist',
        'Final': 'Finalist'
      }
      
      const achievementTitleFormats = {
        'Quarter-Final': (tournamentName) => `Quarter-Finalist in ${tournamentName}`,
        'Semi-Final': (tournamentName) => `Semi-Finalist in ${tournamentName}`,
        'Final': (tournamentName) => `Finalist in ${tournamentName}`
      }
      
      const achievementDescriptions = {
        'Quarter-Final': 'Reached the quarter-finals',
        'Semi-Final': 'Reached the semi-finals',
        'Final': 'Reached the final'
      }
      
      if (highestRound === 'Final') {
        const finalMatch = tournamentMatches.find(m => m.round === 'Final')
        if (finalMatch) {
          const winner = getMatchWinner(finalMatch)
          
          if (winner === currentPlayer.id) {
            const hasChampionAchievement = milestones.value.find(m => 
              m.type === 'tournament_final_win' &&
              m.tournamentId === tournament.id &&
              m.playerId === currentPlayer.id
            )
            if (hasChampionAchievement) {
              continue
            }
          }
        }
      }
      
      const highestRoundMatch = tournamentMatches.find(m => m.round === highestRound)
      
      if (!highestRoundMatch) {
        continue
      }
      
      let achievementDate = new Date()
      if (highestRoundMatch.date) {
        if (highestRoundMatch.date instanceof Date) {
          achievementDate = highestRoundMatch.date
        } else if (highestRoundMatch.date?.toDate && typeof highestRoundMatch.date.toDate === 'function') {
          achievementDate = highestRoundMatch.date.toDate()
        } else if (highestRoundMatch.date) {
          achievementDate = new Date(highestRoundMatch.date)
        }
      }
      
      await fetchMilestones()
      const existing = milestones.value.find(m => 
        m.type === achievementTypes[highestRound] &&
        m.tournamentId === tournament.id &&
        m.playerId === currentPlayer.id
      )
      
      if (existing) {
        const existingDate = existing.date instanceof Date ? existing.date : (existing.date?.toDate ? existing.date.toDate() : new Date(existing.date))
        const dateDiff = Math.abs(achievementDate.getTime() - existingDate.getTime())
        const oneDay = 24 * 60 * 60 * 1000
        
        if (dateDiff > oneDay) {
          const docRef = doc(db, 'milestones', existing.id)
          await updateDoc(docRef, {
            date: Timestamp.fromDate(achievementDate)
          })
          await fetchMilestones()
        }
        continue
      }
      
      const tournamentName = tournament.name || 'Tournament'
      const achievementTitle = achievementTitleFormats[highestRound](tournamentName)
      
      await addDoc(collection(db, 'milestones'), {
        type: achievementType,
        title: achievementTitle,
        description: `${achievementDescriptions[highestRound]} of ${tournamentName}!`,
        category: 'achievement',
        tournamentId: tournament.id,
        tournamentName: tournamentName,
        playerId: currentPlayer.id,
        round: highestRound,
        date: Timestamp.fromDate(achievementDate),
        createdAt: Timestamp.now()
      })
      await fetchMilestones()
    }
  }

  return {
    milestones,
    loading,
    fetchMilestones,
    addMilestone,
    deleteMilestone,
    currentWinStreak,
    currentLossStreak,
    longestWinStreak,
    longestLossStreak,
    personalRecords,
    checkMilestones
  }
})

