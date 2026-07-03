document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const views = document.querySelectorAll('.view');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
            
            if (btn.dataset.target === 'leaderboard-view') {
                updateLeaderboard();
            }
        });
    });

    const matchesContainer = document.getElementById('matches-container');
    
    // Load saved scores from local storage
    const savedScores = JSON.parse(localStorage.getItem('roboconScores')) || {};

    // Render matches
    matches.forEach(match => {
        const redTeam = teams.find(t => t.code === match.red);
        const blueTeam = teams.find(t => t.code === match.blue);

        const savedRed = savedScores[`match_${match.no}_red`] ?? '';
        const savedBlue = savedScores[`match_${match.no}_blue`] ?? '';

        const card = document.createElement('div');
        card.className = 'match-card';
        card.innerHTML = `
            <div class="match-header">
                <span class="match-number">Match #${match.no}</span>
            </div>
            <div class="match-teams">
                <div class="team-block red">
                    <span class="team-code" title="${redTeam ? redTeam.name : ''}">${match.red}</span>
                    <input type="number" class="score-input" data-match="${match.no}" data-color="red" value="${savedRed}" placeholder="Score">
                </div>
                <div class="vs">VS</div>
                <div class="team-block blue">
                    <span class="team-code" title="${blueTeam ? blueTeam.name : ''}">${match.blue}</span>
                    <input type="number" class="score-input" data-match="${match.no}" data-color="blue" value="${savedBlue}" placeholder="Score">
                </div>
            </div>
        `;
        matchesContainer.appendChild(card);
    });

    // Handle score inputs
    matchesContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('score-input')) {
            const matchNo = e.target.dataset.match;
            const color = e.target.dataset.color;
            const val = e.target.value;
            
            savedScores[`match_${matchNo}_${color}`] = val !== '' ? parseInt(val) : null;
            localStorage.setItem('roboconScores', JSON.stringify(savedScores));
            
            // You can auto-update the leaderboard if desired, 
            // but it's currently updated when switching tabs to save performance.
        }
    });

    function calculateTeamStats() {
        const stats = {};
        teams.forEach(t => {
            stats[t.code] = { 
                code: t.code, 
                name: t.name, 
                matchesPlayed: 0, 
                wins: 0, 
                totalScore: 0 
            };
        });

        matches.forEach(match => {
            const redScore = savedScores[`match_${match.no}_red`];
            const blueScore = savedScores[`match_${match.no}_blue`];

            if (redScore != null && blueScore != null) {
                // Both scores entered for this match
                stats[match.red].matchesPlayed++;
                stats[match.blue].matchesPlayed++;

                stats[match.red].totalScore += redScore;
                stats[match.blue].totalScore += blueScore;

                if (redScore > blueScore) {
                    stats[match.red].wins++;
                } else if (blueScore > redScore) {
                    stats[match.blue].wins++;
                }
            }
        });

        return Object.values(stats);
    }

    function updateLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '';

        const stats = calculateTeamStats();

        // Sort by Wins (desc), then by Total Score (desc)
        stats.sort((a, b) => {
            if (b.wins !== a.wins) {
                return b.wins - a.wins;
            }
            return b.totalScore - a.totalScore;
        });

        stats.forEach((team, index) => {
            const rank = index + 1;
            let statusBadge = '<span class="status-badge status-out">Out</span>';
            
            if (rank <= 4) {
                statusBadge = '<span class="status-badge status-qf">Direct QF</span>';
            } else if (rank <= 12) {
                statusBadge = '<span class="status-badge status-pqf">Pre-QF</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${rank}</td>
                <td style="font-weight: 800; color: var(--primary-neon);">${team.code}</td>
                <td>${team.name}</td>
                <td>${team.matchesPlayed}</td>
                <td style="font-weight: bold; color: var(--secondary-neon);">${team.wins}</td>
                <td style="font-weight: bold;">${team.totalScore}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Initialize leaderboard on load
    updateLeaderboard();

    // Export Data functionality
    document.getElementById('export-btn').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedScores));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "robocon_scores.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    // Import Data functionality
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    
    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsedData = JSON.parse(event.target.result);
                if (typeof parsedData === 'object' && parsedData !== null) {
                    localStorage.setItem('roboconScores', JSON.stringify(parsedData));
                    alert('Data imported successfully! The page will now reload.');
                    window.location.reload();
                } else {
                    alert('Invalid file format.');
                }
            } catch (err) {
                alert('Error reading the file. Make sure it is a valid JSON file.');
            }
        };
        reader.readAsText(file);
    });
});

