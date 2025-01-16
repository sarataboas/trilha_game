//------------------------------------------------look for game-----------------------------------------------------------------------------

//------------------------------------------------register----------------------------------------------------------------------
async function registerPlayer(nick, password) {
    try {
        const response = await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nick, password }) // Envia os dados do jogador
        });

        const data = await response.json();

        if (response.ok) {
            // alert('Registro realizado com sucesso!');
            return true
        } else if (data.error === 'User registered with a different password') {
            alert('Erro: Este user já está registrado com outra senha.');
            return false
        } else {
            alert(`Erro no register: ${data.error}`);
            return false
        }
    } catch (error) {
        console.error('Erro ao registrar:', error);
        alert('Erro ao conectar ao servidor!');
        return false
    }
}


//----------------------------------------------------------------------------------------join---------------------------------------------------------

async function joinGame(group, nick, password, size) {
    try {
        const response = await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/join', {
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
        const response = await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/leave', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({nick, password, game}) // Dados enviados ao servidor
        });
    
        const data = await response.json();

        if(!('winner' in data)){
            console.log("O Adversário Ganhou!");
        }

    }catch(error){
        console.log("Leave failed. Response:");
		console.log(response_json);
    }
}


//------------------------------------------------------------update------------------------------------------------------------------------------------------------

async function update(game, nick,group,size){
    let url = `http://twserver.alunos.dcc.fc.up.pt:8008/update?nick=${nick}&game=${game}`;
    const eventSource = new EventSource(url);
    console.log(eventSource);
    console.log(eventSource.readyState);
    eventSource.onmessage = function(event){
        //console.log("entrei no eventsource");
        let data = JSON.parse(event.data);
        console.log(data);

        if('error' in data){
            console.log('update error:', data)
        }
        if('winner' in data){
            //Por alguma coisa a mostrar quem ganhou com o canvas!!
            ranking(group,size)
            console.log("Successfuly received an update from server");
			console.log("Game finished - Winner: " + data.winner);
            if (data.winner != "null"){
                displayWinningMessage(data.winner);
            }
            eventSource.close();
            document.querySelector('.config-area').style.display = 'block';

        }

        else if('board' in data){
            game_board = data.board;
            let gameinstance = new Game(game_board.length, data.players[Object.keys(data.players)[0]],data.players[Object.keys(data.players)[1]], null, data.turn, Object.keys(data.players)[0], Object.keys(data.players)[1]);
            if(document.getElementById('multiplayer-waiting-area').style.display == 'block'){
                document.getElementById('multiplayer-waiting-area').style.display = 'none';
                console.log("Successfuly received an update from server");
                document.getElementById('board-area').style.display = 'block';
                gameinstance.init();
            }

            else if(data.phase == "drop"){
                let color = data.players[data.turn];
                const piecesArea = document.querySelector(color === 'red' ? '.blue-side' : '.red-side');
                if (piecesArea.children.length > 0) {
                piecesArea.removeChild(piecesArea.lastElementChild);  // Remove the last piece element
            }
            }
         

            updateBoard(game_board,gameinstance);


        }
    }

}


//-------------------------------------------------------------notify----------------------------------------------------------------------------------------------------


async function notify(nick, password, game, cell) {
    try {

        const controller = new AbortController();
        // const timeout = setTimeout(() => controller.abort(), 120000); 
        const response = await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/notify', {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({nick, password, game, cell}),
        });
        const data = await response.json();

        if (!response.ok) {
            console.error('Erro ao enviar jogada:', data.error);
            alert(`Erro no notify: ${data.error}`);
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
    console.log("Matriz local para renderizar:", matrix);
    console.log("Nossa matrix:", game.board.matrix);

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

            console.log(
                `Atualizado game.board.matrix[${localRow}][${localCol}] com valor ${matrix[serverRow][serverCol]}`
            );
        }
    }

    // Re-renderizar o tabuleiro
    game.board.renderBoard();
}


async function ranking(group, size){
    try {
        const response = await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/ranking', {
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


function displayWinningMessage(winnerNick) {
    // Obter o canvas do HTML ou criar um dinamicamente
    const canvas = document.getElementById('winningCanvas') || document.createElement('canvas');
    
    // Se o canvas não existir no HTML, criamos e configuramos
    if (!document.getElementById('winningCanvas')) {
        canvas.id = 'winningCanvas';
        canvas.width = 400;
        canvas.height = 200;
        document.body.appendChild(canvas); 

        canvas.style.position = 'fixed';
        canvas.style.top = '50%';
        canvas.style.left = '50%';
        canvas.style.transform = 'translate(-50%, -50%)';
        canvas.style.border = '2px solid black'; 
        canvas.style.boxShadow = '0px 4px 10px rgba(0, 0, 0, 0.3)'; // Sombra para realce
        canvas.style.zIndex = '1000'; 
    }

    const ctx = canvas.getContext('2d');

    // Limpa o canvas antes de desenhar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Estilo do fundo
    ctx.fillStyle = '#f0f8ff'; // Azul claro
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Adiciona texto de "Vencedor"
    ctx.fillStyle = '#222'; // Preto
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';

    // Texto com o nickname do vencedor
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#AC9362'; 
    ctx.fillText(`${winnerNick} venceu!`, canvas.width / 2, 100);

    // Desenha uma borda decorativa
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#6c757d'; // Cinza
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Após 5 segundos, remove o canvas e exibe as configurações
    setTimeout(() => {

        // Voltar às configurações
        document.getElementById('board-area').style.display = 'none';
        canvas.remove();
        document.querySelector('.config-area').style.display = 'block';
    }, 10000); // 5 segundos em milissegundos (5000)
}

