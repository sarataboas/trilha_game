const SERVER = "http://twserver.alunos.dcc.fc.up.pt:8103/";



//------------------------------------------------look for game-----------------------------------------------------------------  

//------------------------------------------------register----------------------------------------------------------------------
async function registerPlayer(nick, password) {
    try {
        const response = await fetch(SERVER + 'register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nick, password }) // Envia os dados do jogador
        });
        console.log("ALGO POR AQUI")
        const data = await response.json();

        if (response.ok) {
            alert('Registo realizado com sucesso!');
            console.log("TERA DE PASAR POR AQUI TBM ")
            return true
        } else if (data.error === 'User registered with a different password') {
            alert('Erro: Este user já está registrado com outra senha.');
            return false
        } else {
            alert(`Erro: ${data.error}`);
            return false
        }
    } catch (error) {
        console.error('Erro ao registrar:', error);
        return false
    }
}


//----------------------------------------------------------------------------------------join---------------------------------------------------------

async function joinGame(group, nick, password, size) {
    try {
        const response = await fetch(SERVER + 'join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ group, nick, password, size }) // Dados enviados ao servidor
        });
    
        const data = await response.json();

        if (response.ok) {
            console.log(`Jogo criado! ID do jogo: ${data.game}`);
            return data.game; // Retorna o ID do jogo
        } else {
            alert(`Erro no join: ${data.error}`);
            return null; // Indica falha no join
        }
    } catch (error) {
        console.error('Erro ao entrar no jogo:', error);
        alert('Erro ao conectar ao servidor!');
        return null; // Indica falha no join
    }
}

//------------------------------------------------------------leave--------------------------------------------------------------------------------------------------------------

async function leave(nick, password, game){
    try{
        const response = await fetch(SERVER + 'leave', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nick, password, game }) // Dados enviados ao servidor
        });
    
        const data = await response.json();

        console.log("Dados do leabe", data);

        if(!('error' in data)){
            console.log("Successfuly left the game");
        }

    }catch(error){
        console.log("Leave failed. Response:");
    }
}


//------------------------------------------------------------update------------------------------------------------------------------------------------------------

async function update(game, nick,group,size){
    let url = SERVER + `update?nick=${nick}&game=${game}`;
    const eventSource = new EventSource(url);
    console.log(eventSource);
    console.log(eventSource.readyState);
    eventSource.onmessage = function(event){
        console.log("Estado da conexão:", eventSource.readyState);
        //console.log("entrei no eventsource");
        let data = JSON.parse(event.data);
        console.log("dados fds", data);

        if(data){
            console.log("quantas vezes atualiza");
        }

        if('error' in data){
            console.log('update error:', data)
        }
        if('winner' in data){
            console.log("ENTROU NO WINNNER")
            if('board' in data){
                game_board = data.board;
                let gameinstance = new Game(game_board.length, data.players[Object.keys(data.players)[0]],data.players[Object.keys(data.players)[1]], null, data.turn, Object.keys(data.players)[0], Object.keys(data.players)[1]);
                //FAZER INterface 
                ranking(group,size)
            }
            console.log("Successfuly received an update from server");
			console.log("Game finished - Winner: " + data.winner);
            eventSource.close();

        }
        
        else if('board' in data){
            game_board = data.board;
            console.log("Este é  game_board:", game_board);
            let gameinstance = new Game(data.size, data.players[Object.keys(data.players)[0]],data.players[Object.keys(data.players)[1]], null, data.turn, Object.keys(data.players)[0], Object.keys(data.players)[1]);
            if(document.getElementById('multiplayer-waiting-area').style.display == 'block'){
                document.getElementById('multiplayer-waiting-area').style.display = 'none';
                console.log("Successfuly received an update from server");
                document.getElementById('board-area').style.display = 'block';
                gameinstance.init();
            }

            console.log("Game_board", game_board);

            gameinstance.board.renderBoard(game_board);

        }
    }

}


//-------------------------------------------------------------notify----------------------------------------------------------------------------------------------------


async function notify(nick, password, game, cell) {
    try {

        const response = await fetch(SERVER + 'notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nick, password, game, cell }),
        });
        
        const data = await response.json();

        if (!response.ok) {
            console.error('Erro ao enviar jogada:', data.error);
            return false;
        }

        console.log('Jogada enviada com sucesso:', data);
        return true;

    } catch (error) {
        console.error('Erro na conexão com o servidor:', error);
        return false;
    }
}


function encodeMove(row, col){
    if (row == 0){
        if (col == 0){
            square = 0;
            position = 0;
        }
        else if(col == 4){
            square = 0;
            position = 1;
        }
        else if(col == 8){
            square = 0;
            position = 2;
        }
    }

    else if(row == 4){
        if (col == 8){
            square = 0;
            position = 3;
        }
        else if(col == 0){
            square = 0;
            position = 7;
        }
        else if(col == 6){
            square = 1;
            position = 3;
        }
        else if(col == 2){
            square = 1;
            position = 7;
        }

    }

    else if(row == 2){
        if(col == 2){
            square = 1;
            position = 0;
        }
        else if(col == 4){
            square = 1;
            position = 1;
        }
        else if(col == 6){
            square = 1;
            position = 2;
        }
    }

    else if(row == 6){
        if(col == 2){
            square = 1;
            position = 6;
        }
        else if(col == 4){
            square = 1;
            position = 5;
        }
        else if(col == 6){
            square = 1;
            position = 4;
        }
        
    }

    else if(row == 8){
        if(col == 0){
            square = 0;
            position = 6;
        }
        else if(col == 4){
            square = 0;
            position = 5;
        }
        else if(col == 8){
            square = 0;
            position = 4;
        }
        
        
    }
    return {square, position};

}

function updateBoard(matrix, game) {

    // Mapa de correspondências
    let board_map = {
        // Posicionamentos da matriz do servidor (matrix) para a nossa matriz (game.board.matrix)
        "[0][0]": [0, 0],
        "[0][1]": [0, 4],
        "[0][2]": [0, 8],
        "[0][3]": [4, 8],
        "[0][4]": [8, 8],
        "[0][5]": [8, 4],
        "[0][6]": [8, 0],
        "[0][7]": [4, 0],
        "[1][0]": [2, 2],
        "[1][1]": [2, 4],
        "[1][2]": [2, 6],
        "[1][3]": [4, 6],
        "[1][4]": [6, 6],
        "[1][5]": [6, 4],
        "[1][6]": [6, 2],
        "[1][7]": [4, 2],
    };

    // Atualizar game.board.matrix com base na matriz recebida
    for (let key in board_map) {
        // Extrair as coordenadas da matriz do servidor a partir da chave do dicionário
        let serverMatch = key.match(/\[(\d+)\]\[(\d+)\]/);
        if (serverMatch) {
            let serverRow = parseInt(serverMatch[1], 10); // Linha da matriz do servidor
            let serverCol = parseInt(serverMatch[2], 10); // Coluna da matriz do servidor
        

            // Obter as coordenadas correspondentes na nossa matriz
            let [localRow, localCol] = board_map[key];
        
            
            if(matrix[serverRow][serverCol] == 'empty'){
                game.board.matrix[localRow][localCol] = 1;
            }
            else if(matrix[serverRow][serverCol] == 'red'){
                game.board.matrix[localRow][localCol] = 'O';
            }
            else if(matrix[serverRow][serverCol] == 'blue'){
                game.board.matrix[localRow][localCol] = 'X';
            }
        }
    }

    console.log("matrix nossa após atualização:", game.board.matrix);

    // Re-renderizar o tabuleiro
    game.board.renderBoard();
}


async function ranking(group, size){
    try {
        const response = await fetch( SERVER + 'ranking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({group, size} ) // Dados enviados ao servidor
        });
    
        const data = await response.json();

        if (response.ok) {
            console.log("Rankings Recebidos");
            console.log(data)
            updateLeaderboardTable(data)

            return; // Retorna o ID do jogo
        } else {
            alert(`Erro no join: ${data.error}`);
            return null; // Indica falha no join
        }
    } catch (error) {
        console.error('Erro ao entrar no jogo:', error);
        alert('Erro ao conectar ao servidor!');
        return null; 
    }

}