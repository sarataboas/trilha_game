class Player {
    constructor(color, size, isAI,nick) {
        this.color = color;
        this.num_pieces = 3 * size;
        this.pieces_in_game = 3 * size; 
        this.possibleMoves_movePhase = []; 
        this.possibleMoves_dropPhase = [];
        this.isAI = isAI;
        this.selectedPiece = null;
        this.isPieceSelected = false;
        this.nick = nick
    }
}

class Game {
    constructor(size, color1, color2, isIA, aiLevel, firstPlayer, nick1, nick2) {

        this.size = size;

        if (isIA == true){
            this.players = [
                new Player(color1, size, firstPlayer === 'computer',nick1),
                new Player(color2, size, firstPlayer !== 'computer',"Computador")
            ];
        }
        else{
            this.players = [
                new Player(color1, size, isIA = null, nick1),
                new Player(color2, size,  isIA = null, nick2)
            ];
        }
        this.currentPlayer = this.players[0];
        this.board = new this.Board(size);
        this.gamePhase = 'drop_pieces';
        this.gameID = null;
        this.possibleMoves = null;
        this.lastmoves = 10; 
        this.mills = [];
        this.aiLevel = aiLevel;
        this.gameEnd = false;
        this.nick1 = nick1
        this.nick2 = nick2
        this.erro = false
        
    }
    // Inner Board class
    Board = class {
        constructor(size) {
            this.size = size;
            this.matrix = this.createBoardMatrix(size);
            
        }
        createBoardMatrix(size) {
            const matrix = [];
            const check_position = [];
            const rows = 2*(2*size) + 1; // Number of rows/cols of the game board
            const midColumnIndex = Math.floor(rows / 2);
            
            // Matrix to verified positions
            for (let r = 0; r < rows; r++) { 
                const line = [];
                for (let c = 0; c < rows; c++){
                    line.push(false);
                }
                check_position.push(line);
            }

            // creates a board matrix 
            for (let i = 0; i < rows; i++) {
                let row = [];
                for (let j = 0; j < rows; j++) {
                    //  main diagonal
                    if (i === j && (i < (size*2) || i >= rows - (size*2)) && i%2 === 0) {
                        row.push(1);
                        check_position[i][j] = true;

                    // second diagonal
                    } else if (i + j === rows - 1 && (i < (size*2) || i >= rows - (size*2)) && i%2 === 0) {
                        row.push(1); 
                        check_position[i][j] = true;

                    // mid Column
                    } else if (j === midColumnIndex && (i < (size*2) || i >= rows - (size*2)) && i%2 === 0) {
                        row.push(1);
                        check_position[i][j] = true;
                    
                    // mid Row
                    } else if (i === midColumnIndex && (j < (size*2) || j >= rows - (size*2)) && j%2 === 0) {
                        row.push(1);
                        check_position[i][j] = true;

                    } else if(( i >=  (size*2) && i < rows-(size*2)) && (j >= (size*2) && j < rows - (size*2)) && i%2 === 0){
                        row.push(0)
                    
                    
                    // Colocação das linhas verticais - entradas com id = 3 
                    } else if (((i > j && i + j < rows - 1) || (i < j && i + j > rows - 1)) && ((i < midColumnIndex && j % 2 === 0) || (i > midColumnIndex && j % 2 === 0)) || (j===midColumnIndex && (i < (size*2 - 1) || i > rows - (size*2)))) {
                        row.push(3);
                        check_position[i][j] = true;
                        

                    // Colocação das linhas horizontais - entradas com id = 2
                    } else if (((i < j && i + j < rows - 1) || (i > j && i + j > rows - 1)) && ((j < midColumnIndex && i % 2 === 0) || (j > midColumnIndex && i % 2 === 0)) || (i===midColumnIndex && (j < (size*2 - 1) || j > rows - (size*2)))) { 
                        row.push(2);
                        check_position[i][j] = true;
                        
                    // Restantes células
                    } else {
                        row.push(0); 
                        check_position[i][j] = true;
                    }
                } 
                matrix.push(row); // Adiciona a linha à matriz
            }
            return matrix;
        }

        
    }

    init() {
        this.createPlayerSides();
    }

    changePlayer() {
        // Toggle between the two players based on the current player
        this.currentPlayer = (this.currentPlayer === this.players[0]) ? this.players[1] : this.players[0];
    }

    // counts the player marks in a list - so that in the checkForMills function we can check if the player has 3 marks in a row/column
    countPlayerMarks(list, playerMark){
        let count = 0;
        for(let i = 0; i < list.length; i++){
            if(list[i] === playerMark){
                count++;
            }
        }
        return count;
    }

    checkForMills(matrix, playerMark) {
        // Verificação Horizontal
        for (let i = 0; i < matrix.length; i++) {
            let row = [];
            for (let j = 0; j < matrix[i].length; j++) {
                if (matrix[i][j] === playerMark) {
                    
                    row.push({ row: i, col: j }); // Adiciona coordenadas
                }
                
                if (row.length === 3) {
                    // Verifica se as três peças são adjacentes
                    if (this.isAdjacent(row[0].row, row[0].col, row[1].row, row[1].col, matrix) &&
                        this.isAdjacent(row[1].row, row[1].col, row[2].row, row[2].col, matrix)) {
                        
                        // Se forem adjacentes e ainda não registadas, adiciona o moinho
                        // Verifica se o moinho já existe
                        const exists = this.mills.some(mill =>
                            mill.every((point, index) => point.row === row[index].row && point.col === row[index].col)
                        );

                        if (!exists) {
                            this.mills.push(row);  // Adiciona o moinho às coordenadas
                            this.updateStatusMessage(`O jogador ${this.currentPlayer.color} fez um moinho! Selecione uma peça do adversário para remover.`);
                            return true;  // Mill found
                        }
                        break;
                    }
                }
            }
        }
    
        // Verificação Vertical
        for (let j = 0; j < matrix[0].length; j++) {
            let col = [];
            for (let i = 0; i < matrix.length; i++) {
                if (matrix[i][j] === playerMark) {
                    col.push({ row: i, col: j }); // Adiciona coordenadas
                }
                if (col.length === 3) {
                    // Verifica se as três peças são adjacentes
                    if (this.isAdjacent(col[0].row, col[0].col, col[1].row, col[1].col, matrix) &&
                        this.isAdjacent(col[1].row, col[1].col, col[2].row, col[2].col, matrix)) {
                        
                        // Se forem adjacentes e ainda não registradas, adiciona o moinho
                        // Verifica se o moinho já existe
                        const exists = this.mills.some(mill =>
                            mill.every((point, index) => point.row === col[index].row && point.col === col[index].col)
                        );

                        if (!exists) {
                            this.mills.push(col);  // Adiciona o moinho às coordenadas
                            return true;  // Mill found
                        }
                    }
                }
            }
        }
    
        return false; // No mill found
    }
    

    isAdjacent(currentRow, currentCol, selectedRow, selectedCol, matrix) {
        // Verifica se estão na mesma linha
        if (currentRow === selectedRow) {
            // Determina a direção para a verificação (da menor coluna para a maior)
            const startCol = Math.min(currentCol, selectedCol);
            const endCol = Math.max(currentCol, selectedCol);
    
            // Verifica se todas as células entre elas (exclusivas) são linhas horizontais (valor 2)
            for (let j = startCol + 1; j < endCol; j++) {
                if (matrix[currentRow][j] !== 2) {
                    return false;
                }
            }
            return true; // Adjacente horizontalmente
        }
    
        // Verifica se estão na mesma coluna
        if (currentCol === selectedCol) {
            // Determina a direção para a verificação (da menor linha para a maior)
            const startRow = Math.min(currentRow, selectedRow);
            const endRow = Math.max(currentRow, selectedRow);
    
            // Verifica se todas as células entre elas (exclusivas) são linhas verticais (valor 3)
            for (let i = startRow + 1; i < endRow; i++) {
                if (matrix[i][currentCol] !== 3) {
                    return false;
                }
            }
            return true; // Adjacente verticalmente
        }
    
        // Não estão nem na mesma linha nem na mesma coluna, então não são adjacentes
        return false;
    }

    

    movePiece(row, col) {
    
        
        if (!this.currentPlayer.isPieceSelected && this.board.matrix[row][col] === (this.currentPlayer.color === 'blue' ? 'X' : 'O')) {
            this.currentPlayer.selectedPiece = {row, col};
            this.currentPlayer.isPieceSelected = true;  
            console.log(`Selected piece at Row ${row}, Column ${col}`);

            // Verificar possíveis movimentos
            this.possibleMoves_movePhase(row, col, this.currentPlayer, this.board.matrix);
            if(!this.myPiecesValid(this.currentPlayer, this.board.matrix)){
                
            }

    
        // Se uma peça já foi selecionada e o jogador clica numa célula vazia
        } else if (this.currentPlayer.isPieceSelected && this.board.matrix[row][col] === 1) {
            const selectedRow = this.currentPlayer.selectedPiece.row;
            const selectedCol = this.currentPlayer.selectedPiece.col;
    
            // Verificar se a célula de destino é adjacente
            if (this.isAdjacent(selectedRow, selectedCol, row, col, this.board.matrix) || this.currentPlayer.pieces_in_game === 3) {
           
                console.log(`Moving piece from (${selectedRow}, ${selectedCol}) to (${row}, ${col})`);

                this.removeMillIfNeeded(row,col); //Remover o Moinho
    
                // Atualizar a matriz com a nova posição
                this.board.matrix[row][col] = this.currentPlayer.color === 'blue' ? 'X' : 'O';
                this.board.matrix[selectedRow][selectedCol] = 1;

                const playerMark = this.currentPlayer.color === 'red' ? 'O' : 'X';
                if (this.checkForMills(this.board.matrix, playerMark)) {  
                    //console.log("Mill formed! Entering remove_piece phase.");
                    this.gamePhase = 'remove_piece';
                    // this.removeOpponentPiece(playerMark,row,col);
                } else {
                    this.currentPlayer.selectedPiece = null;
                    this.currentPlayer.isPieceSelected = false;
                    this.changePlayer();
                }

                if(this.gamePhase === 'draw_phase'){
                    this.lastmoves--;
                }
    
                // Resetar o estado
                this.currentPlayer.selectedPiece = null;
                this.currentPlayer.isPieceSelected = false;
            } else {
                this.updateStatusMessage(`Jogada inválida. Selecione uma célula adjacente.`);   
                //console.log("Invalid move. The target cell is not adjacent.");
                this.currentPlayer.selectedPiece = null;
                this.currentPlayer.isPieceSelected = false;
                game.erro = true;
            
            }
    
        } else {
            // this.updateStatusMessage(`Jogada inválida. Selecione uma das suas peças.`);   
            console.log("Invalid selection. Select one of your own pieces.");
            this.currentPlayer.selectedPiece = null;
            this.currentPlayer.isPieceSelected = false;
            game.erro = true;
        }



    }



   
    possibleMoves_movePhase(selectedRow, selectedCol, player, matrix){
        player.possibleMoves_movePhase = [];
        for(let i = 0; i < matrix.length; i++){
            for(let j = 0; j < matrix[i].length; j++){
                
                if(matrix[i][j] === 1 && this.isAdjacent(selectedRow, selectedCol, i, j, matrix)){
                    
                    player.possibleMoves_movePhase.push({row: i, col: j});
                  
                }
            }
        }
        
    }

    checkWinner(playerQuit = null) {
        // Verifica se um jogador desistiu
        if (playerQuit !== null) {
            const winner = playerQuit === 0 ? "Jogador Azul" : "Jogador Vermelho";
            console.log(`${winner} venceu por desistência.`);
            
            this.gameEnd = true;
    
            // Atualizar a classificação com base no vencedor
            const winnerType = this.players[playerQuit === 0 ? 1 : 0].isAI ? 'AI' : 'humano';
            return;
        }
    



        if(this.players[0].pieces_in_game === 2){
            console.log("Ganhou o vermelho"); 
            this.updateStatusMessage("Vencedor - Jogador Azul!");
            this.gameEnd = true;
            
            
            if(this.players[1].isAI){
                this.updateLeaderboard('AI', this.aiLevel);
            }else{
                this.updateLeaderboard('humano', this.aiLevel);
            }
       
            
        } else if (this.players[1].pieces_in_game === 2){
            console.log("Ganhou o azul!");
            this.updateStatusMessage("Vencedor - Jogador Vermelho!");
            this.gameEnd = true;
            

            if(this.players[0].isAI){
                this.updateLeaderboard('AI', this.aiLevel);
            }else{
                this.updateLeaderboard('humano', this.aiLevel);
            }
       
            
        }
     }

        
    checkDrawValidMoves(){

        //Condição de empate - se  jogador atual não tiver movimentos possíveis

        if(this.currentPlayer.possibleMoves_movePhase.length === 0){
            //console.log(this.currentPlayer.color + " has no possible moves. It's a draw.");
            // console.log("Empate");
            this.updateStatusMessage("Empate! Não há mais movimentos possíveis!");
            this.gameEnd = true;

        } 
    }

    checkDrawPlayCounts(){

        //Condição de Empate - se ambos os jogadores tiverem 3 peças e têm só 10 jogadas possíveis 

        // console.log(this.players[0].pieces_in_game);
        // console.log(this.players[1].pieces_in_game);

        if(this.players[0].pieces_in_game === 3 && this.players[1].pieces_in_game === 3){
            // console.log("Empate -> Cada jogador tem 3 peças.")
            this.updateStatusMessage("Atenção! O jogo termina em 10 jogadas!")
            return true; 

        }

        return false; 
    }

    // Função para remover um moinho de rowMills ou colMills quando uma peça do moinho é removida
    // Função para remover um moinho das coordenadas `mills` quando uma peça do moinho é removida
    removeMillIfNeeded(row, col) {
        row = Number(row);
        col = Number(col);
    
        //console.log(`Called removeMillIfNeeded() for point (${row}, ${col})`);
    
        const millsBefore = this.mills.length;
        this.mills = this.mills.filter(mill => {
            const containsPoint = mill.some(point => Number(point.row) === row && Number(point.col) === col);
    
            if (containsPoint) {
                //console.log(`Removing mill containing point (${row}, ${col})`);
            }
    
            return !containsPoint;
        });
    
        // const millsAfter = this.mills.length;
        //console.log(`Mills before: ${millsBefore}, Mills after: ${millsAfter}`);
    }
    

    removeOpponentPiece(playerMark,row,col) {

        // console.log("Entra na função remove piece")
        const opponentColor = playerMark === 'O' ? 'blue' : 'red';
    
        // Verificar se o jogador clicou numa peça do oponente
        if (this.board.matrix[row][col] === (opponentColor === 'blue' ? 'X' : 'O')) {   
            //console.log(`Removing opponent piece at Row ${row}, Column ${col}`);
            //this.updateStatusMessage(`O jogador ${this.currentPlayer.color} removeu a peça em (${row}, ${col})`);
            this.board.matrix[row][col] = 1; // Define como vazio
        

            this.changePlayer(); 
            this.currentPlayer.pieces_in_game-- ;
            this.changePlayer(); 
            

            this.checkWinner(); 

            // Remover o moinho associado, se houver
            this.removeMillIfNeeded(row, col);

            // Atualizar a fase do jogo
            if (this.players[0].num_pieces === 0 && this.players[1].num_pieces === 0) {
                this.gamePhase = 'move_pieces';
            } else {
                this.gamePhase = 'drop_pieces';
            }

            if (this.checkDrawPlayCounts()){
               
                this.gamePhase = 'draw_phase';
            }
            
            //console.log("Piece removed. Returning to", this.gamePhase, "phase.");

            this.changePlayer();
        } else {
            this.erro = true;
        }
    }

    

    //---------------- AI Implementation ----------------
    makeMove() {
        // console.log("AI move requested.");
        // console.log("this.currentPlayer.isAI: ", this.currentPlayer.isAI);
        if (this.currentPlayer.isAI) {
            if (this.aiLevel === 'easy') {
                console.log("entrei no makemove ialevel easy")
                this.aiEasy();
            }
            // Add more AI behavior (e.g., 'medium', 'hard') here
        }
    }

    possibleMoves_dropPhase(player, matrix){
        console.log("entrei aqui")
        player.possibleMoves_dropPhase = [];
        for(let i = 0; i < matrix.length; i++){
            for(let j = 0; j < matrix[i].length; j++){
                if(matrix[i][j] === 1){
                    player.possibleMoves_dropPhase.push({row: i, col: j});
                    console.log("possible moves ia:", player.possibleMoves_dropPhase)
                }
            }
        }
    }

    

    myPieces(player, matrix) {
        const piecesWithMoves = [];
    
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                const playerMark = player.color === 'red' ? 'O' : 'X';
    
                // Verificar se a célula contém a peça do jogador
                if (matrix[i][j] === playerMark) {
                    // Obter os movimentos possíveis para essa peça
                     this.possibleMoves_movePhase(i, j,player, matrix);
                    const possibleMoves = player.possibleMoves_movePhase;
    
                    // Se tiver movimentos possíveis, adiciona a peça à lista
                    if (possibleMoves.length > 0) {
                        piecesWithMoves.push({ row: i, col: j });
                    }
                }
            }
        }
    
        return piecesWithMoves;
    }

    
    myPiecesValid(player, matrix) {
        const piecesWithMoves = [];
    
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                const playerMark = player.color === 'red' ? 'O' : 'X';
    
                // Verificar se a célula contém a peça do jogador
                if (matrix[i][j] === playerMark) {
                    // Obter os movimentos possíveis para essa peça
                     this.possibleMoves_movePhase(i, j,player, matrix);
                    const possibleMoves = this.possibleMoves_movePhase;
    
                    // Se tiver movimentos possíveis, adiciona a peça à lista
                    if (possibleMoves.length > 0) {
                        return true;
                    }
                }
            }
        }
    
        return false;
    }

    
    myPieces_free_movement(player, matrix) {
        const piecesWithMoves = [];
    
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                const playerMark = player.color === 'red' ? 'O' : 'X';
    
                // Verificar se a célula contém a peça do jogador
                if (matrix[i][j] === playerMark) {
                    piecesWithMoves.push({ row: i, col: j });
                }
            }
        }
    
        return piecesWithMoves;
    }
    


    removablePieces(player, matrix){
        const removablePieces = [];
        for(let i = 0; i < matrix.length; i++){
            for(let j = 0; j < matrix[i].length; j++){ 
                if(matrix[i][j] === (player.color === 'red' ? 'X' : 'O')){
                    removablePieces.push({row: i, col: j});
                }
            }
        }
        return removablePieces;
    }

    //Easy AI - Random moves
    aiEasy() {
        const aiPlayer = this.currentPlayer;
        //console.log("aiPlayer: ", aiPlayer);
        console.log("game phase: ", this.gamePhase);
        

        if (this.gamePhase === 'drop_pieces'){
            this.possibleMoves_dropPhase(aiPlayer, this.board.matrix)
            const possibleMoves = aiPlayer.possibleMoves_dropPhase;
            console.log("possibleMoves: ", possibleMoves);
            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                //console.log(`AI move: Row ${randomMove.row}, Column ${randomMove.col}`);
                this.play(randomMove.row, randomMove.col); // Execute the random move

            } 
        } 
        
        if (this.gamePhase === 'move_pieces'){

            if(aiPlayer.pieces_in_game > 3){
            
                const pieces = this.myPieces(aiPlayer,this.board.matrix);
                if (pieces.length > 0) {
                    const randomMove = pieces[Math.floor(Math.random() * pieces.length)];
                    //console.log(`AI Easy move: Row ${randomMove.row}, Column ${randomMove.col}`);
                    this.play(randomMove.row, randomMove.col); // Execute the random move

                    this.possibleMoves_movePhase(randomMove.row, randomMove.col, aiPlayer, this.board.matrix);
                    const possibleMoves = aiPlayer.possibleMoves_movePhase;
     
                    if (possibleMoves.length > 0) {
                        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    
                        this.play(randomMove.row, randomMove.col); // Execute the random move
                    }
                }
            }

            if(aiPlayer.pieces_in_game === 3){
               
                const pieces = this.myPieces_free_movement(aiPlayer,this.board.matrix);
                console.log(pieces);
                if (pieces.length > 0) {
                    console.log("Entra pieces");
                    const randomMove = pieces[Math.floor(Math.random() * pieces.length)];
                    console.log(`AI Easy move: Row ${randomMove.row}, Column ${randomMove.col}`);
                    this.play(randomMove.row, randomMove.col); // Execute the random move
                    this.possibleMoves_dropPhase(aiPlayer, this.board.matrix);
                    const possibleMoves = aiPlayer.possibleMoves_dropPhase;
                    if (possibleMoves.length > 0) {
                        console.log("entra aqui");
                        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                        // console.log(`AI Easy move: Row ${randomMove.row}, Column ${randomMove.col}`);
                        this.play(randomMove.row, randomMove.col); // Execute the random move
                    }
                }
            }
        }


        if (this.gamePhase === 'remove_piece'){
            const pieces_to_remove = this.removablePieces(aiPlayer, this.board.matrix);
            
            if (pieces_to_remove.length > 0) {
                const randomMove = pieces_to_remove[Math.floor(Math.random() * pieces_to_remove.length)];
                // console.log(`AI Easy move: Row ${randomMove.row}, Column ${randomMove.col}`);
                this.play(randomMove.row, randomMove.col); // Execute the random move
            }
        }
    }
        
    

   play(row, col) {
        let playerMark;
        if (this.currentPlayer.color === 'red') {
            playerMark = 'O';
        } else {
            playerMark = 'X';
        }

        const matrix = this.board.matrix;

        if (this.gamePhase === 'drop_pieces') {
            if (matrix[row][col] === 1 && this.currentPlayer.num_pieces > 0) {
                this.currentPlayer.num_pieces--; 

            matrix[row][col] = playerMark;
        

            if ((this.players[0].num_pieces === 0 && this.players[1].num_pieces === 0) && (this.gamePhase !== 'remove_piece')) {
                this.gamePhase = 'move_pieces';
        
            }

            this.changePlayer();
            let verificar = this.checkForMills(matrix, playerMark);
        } else {
            this.erro = true; 
        }
    } else if (this.gamePhase === 'move_pieces') {
        this.movePiece(row, col);
    } else if (this.gamePhase === 'remove_piece'){

        this.removeOpponentPiece(playerMark, row, col);

    } else if (this.gamePhase === 'draw_phase') {

        if (this.lastmoves === 0) {
            this.checkWinner();

            // this.updateStatusMessage("Empate");
        } else {
            this.movePiece(row, col);
        }
    }
    console.log(this.board.matrix);
   }

}

module.exports = Game; 
