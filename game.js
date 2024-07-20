const crypto = require('crypto');
const readline = require('readline');

// Class to handle game rules
class GameRules {
    constructor(moves) {
        this.moves = moves;
        this.N = moves.length;
        this.p = Math.floor(this.N / 2);
    }

    determineWinner(playerMove, computerMove) {
        const i = this.moves.indexOf(playerMove);
        const j = this.moves.indexOf(computerMove);

        if (i === j) return 'Draw';
        if ((i - j + this.N) % this.N <= this.p) return 'Win';
        return 'Lose';
    }
}

// Class to generate the help table
class TableGenerator {
    constructor(moves) {
        this.moves = moves;
    }

    generateTable() {
        const N = this.moves.length;
        const table = [];
        const header = ['PC/User >', ...this.moves];
        table.push(header);

        for (let i = 0; i < N; i++) {
            const row = [this.moves[i]];
            for (let j = 0; j < N; j++) {
                if (i === j) row.push('Draw');
                else row.push(((i - j + N) % N <= Math.floor(N / 2)) ? 'Win' : 'Lose');
            }
            table.push(row);
        }

        const columnWidths = table[0].map((_, colIndex) => 
            Math.max(...table.map(row => row[colIndex].length))
        );

        return table.map(row => 
            row.map((cell, colIndex) => cell.padEnd(columnWidths[colIndex])).join(' | ')
        ).join('\n');
    }
}


// Class to handle key and HMAC generation
class KeyManager {
    generateKey() {
        return crypto.randomBytes(32).toString('hex'); // 256 bits
    }

    generateHMAC(key, message) {
        const hmac = crypto.createHmac('sha256', Buffer.from(key, 'hex'));
        hmac.update(message);
        return hmac.digest('hex');
    }
}

// Main class to execute the game
class Game {
    constructor(args) {
        if (args.length < 3 || args.length % 2 === 0 || new Set(args).size !== args.length) {
            console.error('Error: Please provide an odd number of unique moves (≥ 3).');
            process.exit(1);
        }

        this.moves = args;
        this.rules = new GameRules(this.moves);
        this.tableGenerator = new TableGenerator(this.moves);
        this.keyManager = new KeyManager();
    }

    start() {
        const key = this.keyManager.generateKey();
        const computerMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        const hmac = this.keyManager.generateHMAC(key, computerMove);

        console.log(`HMAC: ${hmac}`);
        console.log('Available moves:');
        this.moves.forEach((move, index) => console.log(`${index + 1} - ${move}`));
        console.log('0 - exit');
        console.log('? - help');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Enter your move: ', (choice) => {
            if (choice === '?') {
                console.log(this.tableGenerator.generateTable());
                rl.close();
                return;
            }

            const playerIndex = parseInt(choice) - 1;
            if (isNaN(playerIndex) || playerIndex < 0 || playerIndex >= this.moves.length) {
                console.log('Invalid move. Please try again.');
                rl.close();
                return;
            }

            const playerMove = this.moves[playerIndex];
            const result = this.rules.determineWinner(playerMove, computerMove);

            console.log(`Your move: ${playerMove}`);
            console.log(`Computer move: ${computerMove}`);
            console.log(`You ${result}!`);
            console.log(`HMAC key: ${key}`);

            rl.close();
        });
    }
}

// Run the game
const args = process.argv.slice(2);
const game = new Game(args);
game.start();
