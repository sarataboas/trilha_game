//index
const http = require('http');
const url = require('url');
const fs = require('fs');
const fsp = require('fs').promises;
const crypto = require('crypto');
//verificar isto 
const Game = require('./Game')
let newGame; 
let jogo_ativo = false; 
let jogo = new Game(null,"red","blue",null,null,null,null,null);

var defaultCorsHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type, accept',
    'access-control-max-age': 10 // Seconds.
};

var sseHeaders = {    
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'Connection': 'keep-alive'
};

encrypt = function encrypt(input) {
    const md5Hash = crypto.createHash('md5');
    md5Hash.update(input);
    return md5Hash.digest('hex');
}

let games = {};
let logins;
let waiting_for_game = {}; // Quem está aqui ainda não está emparelhado 
let quant_games = 1;

const server = http.createServer(function (request, response){

    response.setHeader('Access-Control-Allow-Origin', '*'); // Permitir qualquer origem

    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query; //JSON OBJECT
    

    // o switch avalia uma expressão com os outros cases
    switch(request.method){
        case 'GET':

            
        switch (pathname) {
            case '/update':
                // Verificar os parâmetros obrigatórios
                if (!('nick' in query && 'game' in query)) {
                    response.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    response.end(JSON.stringify({ "error": "Missing arguments" }));
                    return;
                }
    
                const nick = query.nick;
                const game_id = query.game;
    
                // Configura os headers SSE uma única vez
                response.writeHead(200,sseHeaders);
    
                let interval; // Variável para guardar o intervalo
                let newGame;
    
                // Caso o jogo esteja ativo
                if (jogo_ativo) {

                    const firstKey = Object.keys(waiting_for_game)[0];
                
    
                    const gameEntry = waiting_for_game[firstKey][0];
                    const nick1 = gameEntry.nick;
    
                    const gameEntry_2 = waiting_for_game[firstKey][1];
                    const nick2 = gameEntry_2.nick;
    
                    // Inicializar o jogo se ainda não existir
                    if (!(game_id in games)) {
                        console.log(`Game ID ${game_id} não encontrado. Inicializando novo jogo...`);
                        newGame = new Game(firstKey, "red", "blue", null, null, null, nick1, nick2);
                        games[game_id] = newGame;
                        newGame.connections = {}; // Inicializa o objeto de conexões
                    } else {
                        newGame = games[game_id];
                    }

                    newGame.connections[nick1] = response;
                    newGame.connections[nick2] = response;

                    if(newGame.gameEnd){
                        response.write(`data: ${JSON.stringify({
                            "winner": nick
                        })}\n\n`);
                        response.end(); 
                    }
    
                    // Enviar dados iniciais
                    response.write(`data: ${JSON.stringify({
                    
                        "turn": newGame.currentPlayer.nick,
                        "phase": newGame.gamePhase,
                        "board": newGame.board.matrix,
                        "size": firstKey,
                        "players": {
                            [newGame.players[0].nick]: newGame.players[0].color,
                            [newGame.players[1].nick]: newGame.players[1].color
                        }
                    })}\n\n`);
    
                    response.end(); 
    
                } else {
                    // Jogo não ativo, enviar apenas um evento SSE vazio
                    console.log("OPA SAI DAQUI")
                    response.write(`data: ${JSON.stringify({})}\n\n`);
                    response.end();

                }
    
                // Fechar a conexão SSE
                request.on('close', () => {
    
                    console.log(`Conexão SSE fechada pelo cliente: ${nick}`);
                    if (interval) clearInterval(interval);
                    response.end();
                });
    
                console.log("Conexão SSE criada com sucesso!");
                break;
    
            default:
                response.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                response.end(JSON.stringify({ 'error': 'Page not found' }));
                break;
        }   

              
            break;
        
        // para o metodo get só temos o update
        case 'OPTIONS':
            response.writeHead(200, defaultCorsHeaders);
            response.end();
            break;

        case 'POST':
            console.log("entrei no POST");
            let res = '';
            switch(pathname){
                case '/register':
                    request.on('data', (chunk) => {res += chunk;})
                    request.on('end', () => {
                        try{

                        console.log("entra no register");  const dados = JSON.parse(res);

                      
                        // Validar os argumentos obrigatórios
                        if (!('nick' in dados && 'password' in dados)) {
                            response.writeHead(400, sseHeaders);
                            response.end(JSON.stringify({ "error": "Missing or invalid 'nick' or 'password." }));
                            return;
                        }

                        let nick = dados.nick;
                        let password = dados.password;

                        let valid = true;
                        let exist = false;

                        //chamar o input
                        fsp.readFile('logins.json', 'utf8')
                            .then( (data) => {
                                logins = JSON.parse(data.toString());
                                // for(var nicks in logins){
                                //     if (nick === nicks){
                                //         exist = true;
                                //         if(logins[nicks] === password){}
                                //         else{ valid = false;}
                                //         break;
                                //     }
                                //}
                                if (nick in logins){
                                    console.log("Nick:", nick); 
                                    exist = true;
                                    if(logins[nick] != password){ valid = false; }
                                }

                                if (!exist){
                                    console.log("opa alguma coisa");
                                    logins[nick] = password;
                                    fsp.writeFile('logins.json', JSON.stringify(logins));
                                    console.log("é valido?", valid);
                                     
                                }
                                if (valid){
                                    console.log("passa aqui!!!")
                                    response.writeHead(200, {'Content-Type' :  'application/json; charset=utf-8','Access-Control-Allow-Origin': '*'});
                                    response.end(JSON.stringify({}));
                                }
                                else{
                                    response.writeHead(401, {'Content-Type': 'application/json; charset=utf-8','Access-Control-Allow-Origin': '*'});
                                    response.end(JSON.stringify({"error": "User registered with a different password"}));
                                }
                            })
                            .catch((err) => console.log("Erro: " + err));
                        }
                        
                        catch(err) {console.log(err);}
                    });

                    request.on('error', (err) => {console.log(err.message);});

                    break;

                case '/join':
    
                    console.log("entrei aqui no join");

                    request.on('data', (chunk) => {res += chunk;})

                    request.on('end', async () => {
                        try{
                            
                        
                            const dados = JSON.parse(res);
                            if (!('nick' in dados && 'password' in dados)){
        
                                response.writeHead(400, defaultCorsHeaders);
                                response.end(JSON.stringify({"error" : "Missing arguments"}));
                                return;
                            }

                            let nick = dados.nick;

                            let password = dados.password;

                            let size = dados.size;


                            console.log("size:", size)

                            //caso a pessoa seja a unica que tem o jogo
                            if(!(size in waiting_for_game)){
                                console.log("Primeiro jogador a esperar.");
                                let gameID = 'game_number_'+ quant_games;
                                quant_games++;
                                waiting_for_game[size] = [{ 'game': gameID, 'nick': nick}];
                                console.log("Lista que tenho de usar:", waiting_for_game);
                                let encoded_gameID = encrypt(gameID);
                                console.log(encoded_gameID);
                                response.writeHead(200,defaultCorsHeaders);
                                response.write(JSON.stringify({'game': encoded_gameID}));
                                response.end();
                            }

                            else if (size in waiting_for_game){
                                if(waiting_for_game[size].length > 0){
                                    let gameEntry = waiting_for_game[size][0];
                                    let gameID = gameEntry.game;
                                    let nick1 = gameEntry.nick;
                                    console.log("gameID", gameID);
                                    console.log("nick", nick1);

                                    waiting_for_game[size].push({ 'game': gameID, 'nick': nick });

                                    let encoded_game_id = encrypt(gameID);
                                    response.writeHead(200,defaultCorsHeaders);
                                    response.write(JSON.stringify({'game':encoded_game_id}));
                                    response.end();
                                    jogo_ativo = true ; 
                                }

                            }





                        }
                        catch(err) {console.log(err);}
                    })

                    break;

                case '/ranking':
                        request.on('data', (chunk) => { res += chunk; });
                        request.on('end', async () => {
                            try {
                                // Parse do corpo da requisição
                                let dados = JSON.parse(res);
                    
                                // Validação de parâmetros
                                if (!('group' in dados && 'size' in dados)) {
                                    response.writeHead(400, sseHeaders);
                                    response.end(JSON.stringify({ "error": "Missing or invalid 'group' or 'size'." }));
                                    return;
                                }
                    
                                let group = dados.group;
                                let size = dados.size;
                    
                                if (group <= 0 || size <= 0) {
                                    response.writeHead(400, sseHeaders);
                                    response.end(JSON.stringify({ "error": "Group or size must be greater than 0." }));
                                    return;
                                }
                    
                                // Leitura do ficheiro ranking.json
                                const rankingData = await fsp.readFile('ranking.json', 'utf8');
                                let rankings = JSON.parse(rankingData);
                    
                                // Ordenação por número de vitórias (decrescente)
                                rankings.ranking.sort((a, b) => b.victories - a.victories);
                    
                                // Seleção do Top 10
                                let top10 = rankings.ranking.slice(0, 10);
                    
                                // Resposta com o ranking
                                response.writeHead(200, {
                                    'Content-Type': 'application/json; charset=utf-8',
                                    'Access-Control-Allow-Origin': '*'
                                });
                                response.end(JSON.stringify({ ranking: top10 }));
                            } catch (err) {
                                console.error("Erro ao processar o ranking:", err.message);

                                response.writeHead(500, sseHeaders);

                                response.end(JSON.stringify({ "error": "Internal server error" }));
                            }
                        });
                        break;

                case '/notify':
    
                    console.log("entrei aqui no /notify");

                    request.on('data', (chunk) => {res += chunk;})

                    request.on('end', async () => {
                        try{
                            
                            const dados = JSON.parse(res);

                            //Verificar o nick e password

                            if (!('nick' in dados && 'password' in dados)){

                                response.writeHead(400, defaultCorsHeaders);
                                response.end(JSON.stringify({"error" : "Missing arguments"}));
                                return;
                            }


                            let nick = dados.nick;
                            let password = dados.password;

                            let gameID = dados.game;

                            const game = games[gameID];
                            console.log("lista games",games);

                            console.log("Dados todos do notify",dados);

                            const [ row, col ]  = dados.cell;

                            console.log("Row: ", row);
                            console.log("Col: ", col);
                        
                            if (row === undefined || col === undefined) {
                                
                                console.error("Valores de linha ou coluna não fornecidos:", dados.cell);
                                response.writeHead(400, defaultCorsHeaders);
                                response.end(JSON.stringify({ "error": "Invalid cell coordinates" }));
                                return;

                            } else if (nick !== game.currentPlayer.nick) {
                                console.error("Not your turn to play: ", dados.nick);
                                response.writeHead(400, defaultCorsHeaders);
                                response.end(JSON.stringify({ "error": "Not your turn to play" }));
                             } else {


                                //loop entre fases: 
                                //Primeira, drop fase
                                if (game.gamePhase === "drop_pieces"){
                                    
                                    game.play(row,col);
                                    if (game.erro){
                                        console.error("Seleciona uma peça válida - DROP", dados.nick);
                                        response.writeHead(400, defaultCorsHeaders);
                                        response.end(JSON.stringify({ "error": "Seleciona uma peça válida - DROP" }));
                                        game.erro = false; 
                                    }else{
                                    response.end(JSON.stringify({}));
                                    }
                                }

                                else if (game.gamePhase === "move_pieces"){                                    
                                    game.play(row,col);
                                    if (game.erro){
                                        console.error("Seleciona uma peça válida - MOVE ", dados.nick);

                                        response.writeHead(400, defaultCorsHeaders);
                                        response.end(JSON.stringify({ "error": "Seleciona uma peça válida - MOVE" }));
                                        game.erro = false; 
                                    } else {
                                    response.end(JSON.stringify({}));
                                    }
                                }
                                else if(game.gamePhase === "remove_piece"){
                                    game.play(row,col);
                                    if (game.erro){
                                        console.error("Seleciona uma peça válida - REMOVE ", dados.nick);
                                        response.writeHead(400, defaultCorsHeaders);
                                        response.end(JSON.stringify({ "error": "Seleciona uma peça válida - REMOVE" }));
                                        game.erro = false; 
                                    }else{
                                    response.end(JSON.stringify({}));
                                    }
                                }
                                else if(game.gamePhase === "draw_phase"){
                                    game.play(row,col);
                                    if (game.erro){
                                        console.error("Seleciona uma peça válida - DRAW ", dados.nick);
                                        response.writeHead(400, defaultCorsHeaders);
                                        response.end(JSON.stringify({ "error": "Seleciona uma peça válida - DRAW" }));
                                        game.erro = false; 
                                    }else{
                                    response.end(JSON.stringify({}));
                                    }
                                }
                                

                            }
                        }
                        catch(err) { console.log(err)
                            response.writeHead(400, defaultCorsHeaders);
                            response.end(JSON.stringify({ "error": "Invalid cell coordinates" }));
                        }
                    })

                    break;

                case "/leave":
                    request
                        .on('data', (chunk) => { res += chunk;  })
                        .on('end', async () => {
                            try{
                                let dados = JSON.parse(res); 
                                if (!('nick' in dados && 'password' in dados && 'game' in dados)){response.writeHead(400,defaultCorsHeaders);response.write(JSON.stringify({"error": "Missing arguments"}));response.end();return;}
                                let nick = dados.nick;
                                let password = dados.password;
    
                                let game_id;


                                // if (!(nick in logins)){
                                //     response.writeHead(401,defaultCorsHeaders);
                                //     response.write(JSON.stringify({"error": "User does not exist"}));
                                //     response.end();
                                //     return;
                                // }
                                // if (!(logins[nick]==password)){
                                //     response.writeHead(401,defaultCorsHeaders);
                                //     response.write(JSON.stringify({"error": "User registered with a different password"}));
                                //     response.end();
                                //     return;}

                                      
                                response.writeHead(200,defaultCorsHeaders);
                                console.log("PASSA SEQUER POR AQUI?");
                                let game = games[game_id];

                                if (!jogo_ativo){ // caso saia durante a procura de jogo
                                    console.log("não está em partida");
                        
                                    response.end(JSON.stringify({ "winner": null }));
                                } else {
                                    console.log("Entra no Else");

                                    let winner; 

                                const firstKey = Object.keys(waiting_for_game)[0];
                
                                
                                const gameEntry = waiting_for_game[firstKey][0];
                                const nick1 = gameEntry.nick;
                
                                const gameEntry_2 = waiting_for_game[firstKey][1];
                                const nick2 = gameEntry_2.nick;
                                
                                if(nick === nick1){
                                    winner = nick2;
                                } else{
                                    winner = nick1; 
                                }


                                response.end(JSON.stringify({ "winner": winner }));


                                jogo_ativo = false; 
                            


                                // Atualizar o ranking
                                try {
                                    const rankingData = await fsp.readFile('ranking.json', 'utf8');
                                    const rankings = JSON.parse(rankingData);

                                    let winnerFound = false;
                                    let nick1Found = false;
                                    let nick2Found = false;

                                    for (let player of rankings.ranking) {
                                        if (player.nick === winner) {
                                            player.victories = (player.victories || 0) + 1; // Incrementar vitórias
                                            winnerFound = true;
                                        }
                                        if (player.nick === nick1) {
                                            player.games = (player.games || 0) + 1; // Incrementar jogos
                                            nick1Found = true;
                                        }
                                        if (player.nick === nick2) {
                                            player.games = (player.games || 0) + 1; // Incrementar jogos
                                            nick2Found = true;
                                        }
                                    }
                                
                                    // Adicionar novo jogador ao ranking, se necessário
                                    if (!winnerFound && winner) {
                                        rankings.ranking.push({ nick: winner, victories: 1, games: 1 });
                                        
                                    }
                                    else if (!nick1Found && nick1) {
                                        rankings.ranking.push({ nick: nick1, victories: 0, games: 1 });
                                    }
                                    else if (!nick2Found && nick2) {
                                        rankings.ranking.push({ nick: nick2, victories: 0, games: 1 });
                                    }
                                    await fsp.writeFile('ranking.json', JSON.stringify(rankings, null, 4));
                                } catch (err) {
                                    console.error("Erro ao atualizar o ranking:", err);
                                }

                            }


                            }
                            catch(err){console.log(err);}
                        })
                    break;
                
        }
    }
    
});

server.listen(8008);