let initial_board  = [
    [1, 2, 2, 2, 1, 2, 2, 2, 1]
    [3, 0, 0, 0, 3, 0, 0, 0, 3]
    [3, 0, 1, 2, 1, 2, 1, 0, 3]
    [3, 0, 3, 0, 0, 0, 3, 0, 3]
    [1, 2, 1, 0, 0, 0, 1, 2, 1]
    [3, 0, 3, 0, 0, 0, 3, 0, 3]
    [3, 0, 1, 2, 1, 2, 1, 0, 3]
    [3, 0, 0, 0, 3, 0, 0, 0, 3]
    [1, 2, 2, 2, 1, 2, 2, 2, 1]];


let server_board = [
    ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"], 
    [ "empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"]
];


let board_map = {
    
    // first square
    "server_board[0][0]": initial_board[0][0],
    "server_board[0][1]": initial_board[0][4],
    "server_board[0][2]": initial_board[0][8],
    "server_board[0][3]": initial_board[4][8],
    "server_board[0][4]": initial_board[8][8],
    "server_board[0][5]": initial_board[8][4],
    "server_board[0][6]": initial_board[8][0],
    "server_board[0][7]": initial_board[4][0],

    // second square
    "server_board[1][0]": initial_board[2][2],
    "server_board[1][1]": initial_board[2][4],
    "server_board[1][2]": initial_board[2][6],
    "server_board[1][3]": initial_board[4][6],
    "server_board[1][4]": initial_board[6][6],
    "server_board[1][5]": initial_board[6][4],
    "server_board[1][6]": initial_board[6][2],
    "server_board[1][7]": initial_board[4][2],

};



