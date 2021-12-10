var socket = io();

let board = {}

let orientation = {}

// Set global boolean variables (different for each socket-id)
let player_turn = null;
let discard = false;
let peng = false;
let chi = false;
var own_id = null;
var right_id = null;
var opposite_id = null;
var left_id = null;
var id_peng = null; //for settimeout id
var id_chi = null; //for settimeout id
var round = false;
var own_index = null; //for own wind pos 
var prevailing_wind = null; 
var banker = null;
var players_in_order = null;
var payout = null;
var round_end = false
var player_name = "player" //will be set from input name
var client_room_num = "0";
var time_to_peng = 3000
var time_to_chi = 2000
const time_to_hu = 5000
var countdown = null;
var password = null
var payment_type = 'normal'
var payout_info = null

//alert on load of the page
window.onload = function () {
    alert("Please refer to our Terms and Conditions, located in the link at the top of the page. By clicking OK, you have accepted our terms and conditions, including but not limited to: 6. As the developers, we have intended for this website to be for entertainment only. By no means should this website be used to facilitate illegal transactions of money or money’s worth. By using this website, you agree that you are fully aware of the implications of the Online Gambling Act, CGHA, Betting Act, and any other laws relevant. We will fully comply with higher authorities to provide user information should they deem this site is being abused by specific users for illegal activities, and will comply immediately to shut down this site if higher authorities deem fit.")
}
 
if (window.innerWidth < 550) {
    document.querySelector('#banner_ad').style.width = "24em"
    document.querySelector('#banner_ad').style.height = "4em"
}
//on submission of name, display Hello, player_name! also parses in player_name 
function greet() {
    // for developer login
    if (document.querySelector('#name').value == "DEV TEAM") {
        document.querySelector("#password_block").style.display = "block"
    }
    else {
        player_name = document.querySelector('#name').value
        document.querySelector('#name_block').innerHTML = "Hello, " + player_name + "!"
    }
}
//password required when someone types their name as DEV TEAM. upon login undisable all join buttons
function dev_login() {
    password = document.querySelector('#password').value
    socket.emit('dev_login', password)
}

socket.on('password_correct', function () {
    player_name = "DEV TEAM"
    document.querySelector('#password_block').innerHTML = "Dev team login"
    for (var i = 1; i <= 25; i++) {
        document.getElementById(i + '_button').disabled = false
    }
    document.querySelector("#dev_form").style.display = "block"
})

function dev_allrooms() {
    var broadcast_msg = document.querySelector("#broadcast_text").value
    socket.emit('dev_broadcast', broadcast_msg)
    document.getElementById('dev_form').reset()
}

socket.on('dev_broadcast_to_client', function (msg) {
    var para = document.createElement("P");
    var t = document.createTextNode("DEV TEAM: " + msg);
    para.appendChild(t);
    para.style.fontWeight = "bold"
    document.getElementById("chat").appendChild(para);
})
//load up table when people first connect to the webpage
socket.on('table_firstload', function (players_name_dict, shooter_option) {
    for (var i = 1; i <= Object.keys(players_name_dict).length; i++) {
        document.getElementById(i+'_names').innerHTML = players_name_dict[i]
        document.getElementById(i + '_num').innerHTML = players_name_dict[i].length
        if (players_name_dict[i].length > 0) {
            document.getElementById(i + '_checkbox').checked = shooter_option[i]
            document.getElementById(i + '_checkbox').disabled = true
        }
        if (players_name_dict[i].length == 4) {
            document.getElementById(i + '_button').disabled = true
        }
    }
})
//when Join button is pressed
function join(room_num, speed) {
    var checked = document.getElementById(room_num + '_checkbox').checked //returns true/false
    socket.emit('join_room', room_num, player_name, checked)
    for (var i = 1; i <= 25; i++) {
        document.getElementById(i + '_button').disabled = true
    }
    if (speed == 'fast') {
        time_to_peng = 3000
        time_to_chi = 2000
    }
    else if (speed == 'slow') {
        time_to_peng = 6000
        time_to_chi = 5000
    }
    else {
        time_to_peng = 2000
        time_to_chi = 1000
    }
    if (checked == true) {
        payment_type = "shooter"
    }
    console.log(payment_type)
}

//lock checkbox when one person joins a room
socket.on('lock_checkbox', function (check, room_num) {
    document.getElementById(room_num + '_checkbox').checked = check
    document.getElementById(room_num + '_checkbox').disabled = true
})

//when someone joins a room, update the table for those in waiting room ONLY
socket.on("update_table", function (room, list) {
    document.getElementById(room + '_names').innerHTML = list
    document.getElementById(room + '_num').innerHTML = list.length
    //if there is 4 people in a room, disable the join button
    if (list.length >= 4 && player_name != "DEV TEAM") {
        document.getElementById(room + '_button').disabled = true
    }
    else{
        document.getElementById(room + '_button').disabled = false
    }
})



//on entering a room, enter waiting stage where blank canvas can be seen
socket.on('in_room', function (players_in_room, room_num, players) {
    document.querySelector("#table_block").style.display = "none"
    document.querySelector("#name_block").style.display = "none"
    document.querySelector("#canvas_block").style.display = "inline-block"
    if (document.documentElement.clientWidth >= 1100) {
        document.querySelector("#box").style.display = "inline-block"
    }
    document.querySelector('#info').innerHTML = "No. of players in room: " + (players_in_room.length).toString() + ", waiting for more players to connect..." 
    document.querySelector('#input_mobile').style.display = "block"

    client_room_num = room_num
    //start game for room if room has 4 people
    if (players_in_room.length == 4 && socket.id == Object.keys(players)[0]) {
        socket.emit('load_game', client_room_num)
    }
})

function chat(content) {
    socket.emit('chat', content, client_room_num, player_name)
}
socket.on('chat_to_client', function (incoming_msg, name) {
    var para = document.createElement("P");
    var t = document.createTextNode(name + ": " + incoming_msg);
    para.appendChild(t);
    document.getElementById("chat").appendChild(para);
})
// socket.on('someone_left', function () {
//     document.querySelector('#info').innerHTML = "Someone left, please refresh the page."
//     socket.emit('kick_me_out', client_room_num)
// })

// Will keep listening, but whether action will be taken is different

function listen_keypress(event) {
    switch (event.keyCode) {
        case 49: // 1
            make_discard(0)
            break;
        case 50: // 2
            make_discard(1)
            break;
        case 51: // 3
            make_discard(2)
            break;
        case 52: // 4
            make_discard(3)
            break;
        case 53: // 5
            make_discard(4)
            break;
        case 54: // 6
            make_discard(5)
            break;
        case 55: // 7
            make_discard(6)
            break;
        case 56: // 8
            make_discard(7)
            break;
        case 57: // 9
            make_discard(8)
            break;
        case 48: // 0
            make_discard(9)
            break;
        case 113: // q
            make_discard(10)
            break;
        case 119: // w
            make_discard(11)
            break;
        case 101: // e
            make_discard(12)
            break;
        case 114: // r
            make_discard(13)
            break;
        case 112: //p (replacement for enter)
            make_peng()
            break;
        case 122://z (for chi left)
            make_chi('left')
            break;
        case 120: //x (for chi center)
            make_chi('center')
            break;
        case 99: //c (for chi right)
            make_chi('right')
            break;
        case 104: //h (for round won)
            hu()
            break;
        case 103: //g (for gang)
            make_gang()
            break;

    }
}
function listen_inputs() {
    document.addEventListener('keypress', listen_keypress, true)
}

var canvas = document.querySelector("#myCanvas");
canvas.width = 800
canvas.height = 600
canvas.style.width = "800"
canvas.style.height = "600"
var ctx = canvas.getContext("2d");
ctx.font = "13px helvetica"; 
loadAndDrawImage("https://mcdn.wallpapersafari.com/medium/73/10/VCIq0j.jpg");

// Initial loading of the game
socket.on('load_4', function (players) {
    listen_inputs()
    if (players[socket.id].id == socket.id){
            own_index = players[socket.id].wind_pos
            banker = players[socket.id].ordered_players[0]
            players_in_order = players[socket.id].ordered_players
            prevailing_wind = 0
            own_id = socket.id
            
            // right_id is used for pushing next turn of player
            right_id = players[players[socket.id].ordered_players[(own_index + 1) % 4]].id
            opposite_id = players[players[socket.id].ordered_players[(own_index + 2) % 4]].id
            left_id = players[players[socket.id].ordered_players[(own_index + 3) % 4]].id
            
            // orientation of board given socket_id
            orientation = {
                [own_id]: 'own',
                [right_id]: 'right',
                [opposite_id]: 'opposite',
                [left_id]: 'left'
                }
            

            // transfers servers logic to player
            load(players)

            console.log(orientation)
            console.log(board)
        
        }
    update_board(board)    
    }
)

// set player turn after delay to prevent mix-up during no p/c condition
socket.on('set_player_turn', function(data){

    player_turn = data
    peng = false;
    chi = false;
    if (player_turn == socket.id) {
        document.querySelector("#info").innerHTML = "It is your turn. Please discard a tile."
    }
    else {
        document.querySelector("#info").innerHTML = "It is the "+ orientation[player_turn] + "  player's turn."
    }
})

socket.on('draw_tile', function(){
    setTimeout(function() {
        if (player_turn == socket.id) {
            console.log('drwingg')
            draw_tile(board)
            socket.emit('check_win', board['own'], own_index, prevailing_wind, socket.id, board['all'], client_room_num)
        }
        
        update_board(board)
    }, 200);
})

socket.on('discard', function(){
    setTimeout(function () {
        if (player_turn == socket.id) {
            discard = true
            document.querySelector("#info").innerHTML = "It is your turn. Please discard a tile."
        }
        else {
            document.querySelector("#info").innerHTML = "It is the " + orientation[player_turn] + "  player's turn."
        }
    }, 400)
})


socket.on('option_to_win', function(data, tai_won, tiles, socketid, all){
    payout = parseInt(tai_won.slice(0,1))
    payout_info = tai_won.slice(1).split(' ')
    
    if (player_turn != socket.id){
    board[orientation[socketid]] = tiles
    board['all'] = all
    }
    
    setTimeout(function(){
        update_board(board)
    }, 400)


    if (socket.id == data){
        round = true
        document.querySelector("#info").innerHTML = "You can hu. Press H to game!"

        if (player_turn == socket.id) { 
            ctx.drawImage(hu_notif, 325, 150, 150, 75)
            num_to_pic_smaller(board['own'].tiles_in_hand[board['own'].tiles_in_hand.length - 1], 385, 179)
        }

        else if (player_turn != socket.id && board[orientation[player_turn]].discard_tile != null){
            ctx.drawImage(hu_notif, 325, 150, 150, 75)
            num_to_pic_smaller(board[orientation[player_turn]].discard_tile[0], 385, 179)
        }

        setTimeout(function(){
            if (round_end == false) {
            round = false
            if (player_turn == socket.id){
                socket.emit('continue_round', client_room_num)
            }
    
            else if (player_turn != socket.id){
                socket.emit('continue_round_from_other', tiles, socketid, all, client_room_num)
            }
        }
        }, time_to_hu + 400)
    }

    


})

socket.on('end_game_to_client', function(data, tiles){
    gtag('event', 'round_draw_completed')
    check_non_tai_scoring(data, tiles)
    
    round_end_display(board)

    // display neutral message

    // to change to whether have ganged
    if (banker != data){
        var new_banker = players_in_order.indexOf(banker) + 1
        
        if (new_banker == 4){
            
            if (prevailing_wind == 3){
                // Gameend()
                gtag('event', 'game_completed')
                return
            }
            
            // End of one feng
            prevailing_wind ++
            banker = players_in_order[0]
        }

        // normal increment
        else{
            banker = players_in_order[new_banker]
            own_index = (own_index + 3) % 4
        }

        
    }
    setTimeout(function(){
    if (socket.id == data){
        // request new_round from server
        socket.emit('new_round_to_server', players_in_order, banker, client_room_num)
    }
    }, 8000)

})

socket.on('round_won_to_client', function(data, tiles){
    gtag('event', 'round_completed')

    check_non_tai_scoring(data, tiles)

    
    // calculate winnings (if data != socketid, then minus. Else plus the tai)
    for (let i = 0; i < 4; i++){
        
        // winner
        if (data == players_in_order[i]){
            
            //zi mo 
            if (data == player_turn){
            board[orientation[players_in_order[i]]].chips = board[orientation[players_in_order[i]]].chips + (20 * Math.pow(2, (payout - 1))) * 3
            }

            // someone shoot
            else{
                board[orientation[players_in_order[i]]].chips = board[orientation[players_in_order[i]]].chips + (20 * Math.pow(2, (payout - 1))) * 2
            }
        
        }

        // loser
        else {
            
            // zimo
            if (data == player_turn){
                board[orientation[players_in_order[i]]].chips = board[orientation[players_in_order[i]]].chips - (20 * Math.pow(2, (payout - 1)))
            }

            // not zimo
            else {
                
                //if shooter
                if(players_in_order[i] == player_turn && payment_type == 'normal'){
                board[orientation[players_in_order[i]]].chips = board[orientation[players_in_order[i]]].chips - (20 * Math.pow(2, (payout - 1)))
                }


                // if shooter pay
                else if(players_in_order[i] == player_turn && payment_type == 'shooter'){
                    board[orientation[players_in_order[i]]].chips = board[orientation[players_in_order[i]]].chips - (20 * Math.pow(2, (payout - 1))) * 2
                }
            
                // Normal loser
                else if (players_in_order[i] != player_turn && payment_type == 'normal'){
                board[orientation[players_in_order[i]]].chips = board[orientation[players_in_order[i]]].chips - (10 * Math.pow(2, (payout - 1)))                    
                }
            }
        }
    }

   
    

    round_end_display(board)
    //display hu in info for winner and losers
    if (socket.id == data) {
        document.querySelector("#info").innerHTML == "Hu! You've won this round!"
    }
    else {
        document.querySelector("#info").innerHTML == "Hu!" + board[orientation[data]].username + " (" + orientation[data] + ") has won this round."
    }

    // update zhuang - and wind - and prevailing wind if zhuang move 4 times
    if (banker != data){
        var new_banker = players_in_order.indexOf(banker) + 1
        
        if (new_banker == 4){
            
            if (prevailing_wind == 3){
                // Gameend()
                gtag('event', 'game_completed')
                return
            }
            
            // End of one feng
            prevailing_wind ++
            banker = players_in_order[0]
        }

        // normal increment
        else{
            banker = players_in_order[new_banker]
            own_index = (own_index + 3) % 4
        }
        
    }
    setTimeout(function(){
    if (socket.id == data){
        // request new_round from server
        socket.emit('new_round_to_server', players_in_order, banker, client_room_num)
    }
    }, 7000)
})

socket.on('new_round_to_client', function(new_tiles){
    reload(new_tiles)
    setTimeout(function(){
    update_board(board)
}, 500)
})

 socket.on('discard_to_client', function(tiles, socketid, all){
    board[orientation[socketid]] = tiles
    board['all'] = all
    peng = board[orientation[socketid]].discard_tile
    update_board(board)
    console.log(board[orientation[socketid]].discard_tile[0])
    

    if (socketid != socket.id){
        document.querySelector("#info").innerHTML = "The "+ orientation[player_turn]+ " player discarded. You can peng if available."
    }
    else {
        document.querySelector("#info").innerHTML = "You discarded."
    }


    var socket_to_send_ok_to_chi = player_turn
    console.log(socket_to_send_ok_to_chi)
    console.log(peng[0])
    for (let i = 0; i < 4; i++){
        console.log(can_peng(board[orientation[players_in_order[i]]].tiles_in_hand, peng[0]))
        if (can_peng(board[orientation[players_in_order[i]]].tiles_in_hand, peng[0]) != false && players_in_order[i] != player_turn){
            socket_to_send_ok_to_chi = players_in_order[i]
            console.log(socket_to_send_ok_to_chi)
            break
        }
    }

    // change pong to true for the other 3 players

    // display Peng option
    if (socket.id != player_turn && peng != false) {
        
    // display gang option
    var match_tiles_gang = can_gang(board['own'].tiles_in_hand, peng[0])
    if (match_tiles_gang != false){
        display_gang(match_tiles_gang)
    }
    
    var match_tiles = can_peng(board['own'].tiles_in_hand, peng[0])
    if (match_tiles != false) {
        setTimeout(display_peng(match_tiles), 10)
        }
    }

    var x = time_to_peng / 1000

    ctx.strokeText(x.toString(), 620, 470)
    countdown_peng = setInterval(function () {
        x -= 1
        if (x >= 1) {
            ctx.drawImage(background, 617, 460, 20, 20)
            ctx.strokeText(x.toString(), 620, 470)
        }
        else {
            ctx.drawImage(background, 617, 460, 20, 20)
            clearInterval(countdown_peng)
        }
    }, 1000)

    // request pong cleared 
    id_peng = setTimeout(function () {
        peng = false
        if (socket.id == socket_to_send_ok_to_chi){
            console.log('emitting no_peng')
            socket.emit('no_peng', socketid, client_room_num)
        }
     }, time_to_peng);

})

socket.on('ok_to_chi', function(socketid){

    ctx.drawImage(peng_overlay, 500, 445, 160, 80)
    ctx.drawImage(peng_overlay, 500, 370, 150, 75)

    if (orientation[socketid] == 'left') {
        chi = board["left"].discard_tile

        // display chi options
        var left_chi = can_chi('left')
        var center_chi = can_chi('center')
        var right_chi = can_chi('right')

        if (left_chi != false || center_chi != false || right_chi != false) {
           display_chi(left_chi, center_chi, right_chi)
        }
    }

    //countdown on screen for chi
    var x = time_to_chi / 1000

    ctx.strokeText(x.toString(), 620, 470)
    countdown_chi = setInterval(function () {
        x -= 1
        if (x >= 1) {
            ctx.drawImage(background, 617, 460, 20, 20)
            ctx.strokeText(x.toString(), 620, 470)
        }
        else {
            ctx.drawImage(background, 617, 460, 20, 20)
            clearInterval(countdown_chi)
        }
    }, 1000)

    
    // set chi to false, request next turn
    id_chi = setTimeout(function() {
        chi = false
        
        player_turn = players_in_order[(players_in_order.indexOf(player_turn) + 1) % 4]

        //implement the button here
        if (player_turn == socket.id) {
            document.querySelector("#info").innerHTML = "It is your turn."
        }
        else {
            document.querySelector("#info").innerHTML = "It is now the " + orientation[player_turn] + " player's turn."
        }

        
        if (player_turn == socket.id) {
            board['discard_pile'].push(board[orientation[socketid]].discard_tile[0])
            socket.emit('update_discard_pile', board['discard_pile'], client_room_num)
            console.log('requesting draw to myself')
            socket.emit('request_draw_tile', client_room_num)
        }
    }, time_to_chi)
    
    
})

// disrupts discard to clients
socket.on('peng_to_clients', function(tiles, socketid){
        board[orientation[socketid]] = tiles
        board['own'].discard_tile = null
        board['left'].discard_tile = null
        board['right'].discard_tile = null
        board['opposite'].discard_tile = null
        console.log('Im updating peng')
        clearTimeout(id_peng)
        clearTimeout(id_chi)
        clearInterval(countdown_peng)
        ctx.drawImage(background, 635, 460, 5, 5)
        update_board(board)

    if (socket.id == socketid) {

        socket.emit('request_special_change', socket.id, client_room_num)
        document.querySelector('#info').innerHTML = "You penged! Please discard a tile."

    }
    else {
        document.querySelector('#info').innerHTML = "The " + orientation[socketid] + " player has penged and is now discarding."
    }

})

socket.on('chi_to_clients', function(tiles, socketid){
        board[orientation[socketid]] = tiles
        board['own'].discard_tile = null
        board['left'].discard_tile = null
        board['right'].discard_tile = null
        board['opposite'].discard_tile = null
        console.log('Im updating chi')
        clearTimeout(id_chi)
        clearInterval(countdown_chi)
        ctx.drawImage(background, 635, 460, 5, 5)
        update_board(board)

        if (socket.id == socketid){
            socket.emit('request_special_change', socket.id, client_room_num)
            document.querySelector('#info').innerHTML = "You chowed! Please discard a tile."
    }
        else {
            document.querySelector('#info').innerHTML = "The" + orientation[socketid]+" player has chowed and is now discarding."
        }
})

// update board on normal turn
socket.on('discard_board_to_client', function(tiles){
    board['discard_pile'] = tiles
    board['own'].discard_tile = null
    board['right'].discard_tile = null
    board['opposite'].discard_tile = null
    board['left'].discard_tile = null
    update_board(board)
})




// ========================================================================================================================
// ================================================FUNCTIONS============================================================
// ========================================================================================================================

//ONLY WORKS FOR CHROME
ctx.imageSmoothingQuality = "high"
// Create <img> element
var tile_fd = document.createElement("img");
// Set the src
tile_fd.src = "/static/mahjong_pics_v1/tile_fd.jpg"
var tile_fd_shifted = document.createElement("img");
tile_fd_shifted.src = "/static/mahjong_pics_v1/tile_fd_shifted.jpg"
var red_circle = document.createElement("img");
red_circle.src = "/static/mahjong_pics_v1/red_circle.png"

//all tile pics
var one_tong = document.createElement("img")
one_tong.src = "/static/mahjong_pics_v1/1_tong.jpg"
var two_tong = document.createElement("img")
two_tong.src = "/static/mahjong_pics_v1/2_tong.jpg"
var three_tong = document.createElement("img")
three_tong.src = "/static/mahjong_pics_v1/3_tong.jpg"
var four_tong = document.createElement("img")
four_tong.src = "/static/mahjong_pics_v1/4_tong.jpg"
var five_tong = document.createElement("img")
five_tong.src = "/static/mahjong_pics_v1/5_tong.jpg"
var six_tong = document.createElement("img")
six_tong.src = "/static/mahjong_pics_v1/6_tong.jpg"
var seven_tong = document.createElement("img")
seven_tong.src = "/static/mahjong_pics_v1/7_tong.jpg"
var eight_tong = document.createElement("img")
eight_tong.src = "/static/mahjong_pics_v1/8_tong.jpg"
var nine_tong = document.createElement("img")
nine_tong.src = "/static/mahjong_pics_v1/9_tong.jpg"
var one_bamboo = document.createElement("img")
one_bamboo.src = "/static/mahjong_pics_v1/1_bamboo.jpg"
var two_bamboo = document.createElement("img")
two_bamboo.src = "/static/mahjong_pics_v1/2_bamboo.jpg"
var three_bamboo = document.createElement("img")
three_bamboo.src = "/static/mahjong_pics_v1/3_bamboo.jpg"
var four_bamboo = document.createElement("img")
four_bamboo.src = "/static/mahjong_pics_v1/4_bamboo.jpg"
var five_bamboo = document.createElement("img")
five_bamboo.src = "/static/mahjong_pics_v1/5_bamboo.jpg"
var six_bamboo = document.createElement("img")
six_bamboo.src = "/static/mahjong_pics_v1/6_bamboo.jpg"
var seven_bamboo = document.createElement("img")
seven_bamboo.src = "/static/mahjong_pics_v1/7_bamboo.jpg"
var eight_bamboo = document.createElement("img")
eight_bamboo.src = "/static/mahjong_pics_v1/8_bamboo.jpg"
var nine_bamboo = document.createElement("img")
nine_bamboo.src = "/static/mahjong_pics_v1/9_bamboo.jpg"
var one_wan = document.createElement("img")
one_wan.src = "/static/mahjong_pics_v1/1_wan.jpg"
var two_wan = document.createElement("img")
two_wan.src = "/static/mahjong_pics_v1/2_wan.jpg"
var three_wan = document.createElement("img")
three_wan.src = "/static/mahjong_pics_v1/3_wan.jpg"
var four_wan = document.createElement("img")
four_wan.src = "/static/mahjong_pics_v1/4_wan.jpg"
var five_wan = document.createElement("img")
five_wan.src = "/static/mahjong_pics_v1/5_wan.jpg"
var six_wan = document.createElement("img")
six_wan.src = "/static/mahjong_pics_v1/6_wan.jpg"
var seven_wan = document.createElement("img")
seven_wan.src = "/static/mahjong_pics_v1/7_wan.jpg"
var eight_wan = document.createElement("img")
eight_wan.src = "/static/mahjong_pics_v1/8_wan.jpg"
var nine_wan = document.createElement("img")
nine_wan.src = "/static/mahjong_pics_v1/9_wan.jpg"

var blue_1_flower = document.createElement("img")
blue_1_flower.src = "/static/mahjong_pics_v1/blue_1_flower.jpg"
var blue_2_flower = document.createElement("img")
blue_2_flower.src = "/static/mahjong_pics_v1/blue_2_flower.jpg"
var blue_3_flower = document.createElement("img")
blue_3_flower.src = "/static/mahjong_pics_v1/blue_3_flower.jpg"
var blue_4_flower = document.createElement("img")
blue_4_flower.src = "/static/mahjong_pics_v1/blue_4_flower.jpg"
var red_1_flower = document.createElement("img")
red_1_flower.src = "/static/mahjong_pics_v1/red_1_flower.jpg"
var red_2_flower = document.createElement("img")
red_2_flower.src = "/static/mahjong_pics_v1/red_2_flower.jpg"
var red_3_flower = document.createElement("img")
red_3_flower.src = "/static/mahjong_pics_v1/red_3_flower.jpg"
var red_4_flower = document.createElement("img")
red_4_flower.src = "/static/mahjong_pics_v1/red_4_flower.jpg"
var cat = document.createElement("img")
cat.src = "/static/mahjong_pics_v1/cat.jpg"
var mouse = document.createElement("img")
mouse.src = "/static/mahjong_pics_v1/mouse.jpg"
var caterpillar = document.createElement("img")
caterpillar.src = "/static/mahjong_pics_v1/caterpillar.jpg"
var chicken = document.createElement("img")
chicken.src = "/static/mahjong_pics_v1/chicken.jpg"

var dong_pic = document.createElement("img")
dong_pic.src = "/static/mahjong_pics_v1/dong_feng.jpg"
var nan_pic = document.createElement("img")
nan_pic.src = "/static/mahjong_pics_v1/nan_feng.jpg"
var xi_pic = document.createElement("img")
xi_pic.src = "/static/mahjong_pics_v1/xi_feng.jpg"
var bei_pic = document.createElement("img")
bei_pic.src = "/static/mahjong_pics_v1/bei_feng.jpg"
var green_dragon = document.createElement("img")
green_dragon.src = "/static/mahjong_pics_v1/green_dragon.jpg"
var white_dragon = document.createElement("img")
white_dragon.src = "/static/mahjong_pics_v1/white_dragon.jpg"
var red_dragon = document.createElement("img")
red_dragon.src = "/static/mahjong_pics_v1/red_dragon.jpg"

var red_dice_v = document.createElement("img")
red_dice_v.src = "/static/mahjong_pics_v1/red_dice_v.jpg"
var red_dice_h = document.createElement("img")
red_dice_h.src = "/static/mahjong_pics_v1/red_dice_h.jpg"
var peng_notif = document.createElement("img")
peng_notif.src = "/static/mahjong_pics_v1/peng_notif.png"
var chi_notif = document.createElement("img")
chi_notif.src = "/static/mahjong_pics_v1/chi_notif.png"
var gang_notif = document.createElement("img")
gang_notif.src = "/static/mahjong_pics_v1/gang_notif.JPG"
var hu_notif = document.createElement("img")
hu_notif.src = "/static/mahjong_pics_v1/hu_notif.png"
var end_game_tai = document.createElement("img")
end_game_tai.src = "/static/mahjong_pics_v1/end_game_tai.png"
var peng_overlay = document.createElement("img")
peng_overlay.src = "/static/mahjong_pics_v1/peng_overlay.PNG"

var background = document.createElement("img")
background.src = "https://mcdn.wallpapersafari.com/medium/73/10/VCIq0j.jpg"

//print out board
function update_board(board) {
    ctx.drawImage(background, 0, 0, 800, 600)

    // Number of tiles
    var num_of_tiles = new Set(board['all']).size - 16
    document.querySelector("#tiles_left").innerHTML = "No. of tiles left to draw: " + num_of_tiles.toString()
    
    for (var i = 0; i < board['discard_pile'].length; i++) {
        if (i <= 16) {
            num_to_pic_smaller(board['discard_pile'][i], (i * 30 + 155), 250)
        }
        else if (i <= 33) {
            num_to_pic_smaller(board['discard_pile'][i], (i-17) * 30 + 155, 290)
        }
        else if (i <= 50) {
            num_to_pic_smaller(board['discard_pile'][i], (i - 34) * 30 + 155, 330)
        }
        else if (i <= 67){
            num_to_pic_smaller(board['discard_pile'][i], (i - 51) * 30 + 155, 370)
        }
        else if (i <= 71) {
            num_to_pic_smaller(board['discard_pile'][i], (i - 68) * 30 + 155, 410)
        }
        else if (i <= 88) {
            num_to_pic_smaller(board['discard_pile'][i], (i - 72) * 30 + 155, 450)
        }
        else if (i <= 105) {
            num_to_pic_smaller(board['discard_pile'][i], (i - 89) * 30 + 155, 490)
        }
    }
    
    //displays prevailing wind just above own chip count
    switch (prevailing_wind) {
        case 0:
            ctx.drawImage(dong_pic, 680, 508, 24, 32)
            break;
        case 1:
            ctx.drawImage(nan_pic, 680, 508, 24, 32)
            break;
        case 2:
            ctx.drawImage(xi_pic, 680, 508, 24, 32)
            break;
        case 3:
            ctx.drawImage(bei_pic, 680, 508, 24, 32)
            break;
    }
    ctx.lineWidth = "1";
    ctx.rect(0, 540, 120, 60);
    ctx.fillStyle = "white"
    ctx.fill();

    ctx.rect(680, 540, 120, 60);
    ctx.fillStyle = "white"
    ctx.fill();

    ctx.rect(0, 0, 120, 60);
    ctx.fillStyle = "white"
    ctx.fill();

    ctx.rect(680, 0, 120, 60);
    ctx.fillStyle = "white"
    ctx.fill();

    //own tiles
    for (var i = 0; i < board['own'].tiles_in_hand.length; i++) {
        let current_tile = board['own'].tiles_in_hand[i] //tile no.
        num_to_pic(current_tile, (i + 1) * 36 + 120, 550)
        switch (i) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
                ctx.strokeText(i + 1, (i + 1) * 36 + 135, 543)
                break;
            case 9:
                ctx.strokeText('0', (i + 1) * 36 + 135, 543)
                break;
            case 10:
                ctx.strokeText('q', (i + 1) * 36 + 135, 543)
                break;
            case 11:
                ctx.strokeText('w', (i + 1) * 36 + 135, 543)
                break;
            case 12:
                ctx.strokeText('e', (i + 1) * 36 + 135, 543)
                break;
            case 13:
                ctx.strokeText('r', (i + 1) * 36 + 135, 543)
                break;
        }
    }

    //own hua
    for (var x = 0; x < board['own'].tiles_in_board.length; x++) {
        var x1 = (x + 1) * 30 +150
        num_to_pic_smaller(board['own'].tiles_in_board[x], x1, 480)
    }
    var x_coord = (board['own'].tiles_in_board.length + 1) * 30 +150

    for (var x = 0; x < board['own'].hua_array.length; x++) {
        num_to_pic_smaller(board['own'].hua_array[x], x_coord+(x*30), 480)
    }

    //own discard
    if (board['own'].discard_tile != null) {
        ctx.drawImage(red_circle, 568, 426, 60, 80)
        num_to_pic(board['own'].discard_tile[0], 580, 440)
    }
    //own chips
    ctx.strokeText("Your points:", 700, 565)
    ctx.strokeText(board['own'].chips.toString(), 720, 585)

    //dealer dice
    if (socket.id == banker) {
        ctx.drawImage(red_dice_v, 665, 545, 15, 55)
    }

    // Opp player tiles
    for (var i = 0; i < board['opposite'].tiles_in_hand.length; i++) {
        ctx.drawImage(tile_fd, i * 36 + 170, 30, 36, 48)
    }

    //opp player hua
    for (var p = 0; p < board['opposite'].hua_array.length; p++) {
        num_to_pic_smaller(board['opposite'].hua_array[p], p * 30 + 175, 100)

    }
    p2 = p * 30 + 175
    for (var p = 0; p < board['opposite'].tiles_in_board.length; p++) {
        num_to_pic_smaller(board['opposite'].tiles_in_board[p], p * 30 + p2, 100)

    }

    // Opp player discard
    if (board['opposite'].discard_tile != null) {
        ctx.drawImage(red_circle, 188, 156, 60, 80)
        num_to_pic(board['opposite'].discard_tile[0], 200, 170) 
    }
    //opp player chips
    ctx.strokeText(board['opposite'].username + "'s (opposite)", 10, 15)
    ctx.strokeText("points:", 38, 32)
    ctx.strokeText(board['opposite'].chips.toString(), 45, 50)

    //dealer dice
    if (board["opposite"].id == banker) {
        ctx.drawImage(red_dice_v, 120, 0, 15, 55)
    }
    
    // right
    for (let i = 0; i < board['right'].tiles_in_hand.length; i++) {
        ctx.drawImage(tile_fd_shifted, 740, i * 36 + 65, 48, 36)
    }

    //right player hua
    for (var p = 0; p < board['right'].hua_array.length; p++) {
        num_to_pic_rotated_right(board['right'].hua_array[p], 110 + p * 30, 480, 30, 40)
    }
    p2 = p * 30 + 110
    for (var p = 0; p < board['right'].tiles_in_board.length; p++) {
        num_to_pic_rotated_right(board['right'].tiles_in_board[p], p * 30 + p2, 480, 30, 40)

    }
    //right tile discarded, if available
    if (board['right'].discard_tile != null) {
        ctx.drawImage(red_circle, 588, 186, 60, 80)
        num_to_pic(board['right'].discard_tile[0], 600, 200, 90) 
    }
    //right player chips
    ctx.strokeText(board['right'].username + "'s (right)", 698, 17)
    ctx.strokeText("points:", 718, 34)
    ctx.strokeText(board['right'].chips.toString(), 720, 52)

    //dealer dice
    if (board["right"].id == banker) {
        ctx.drawImage(red_dice_h, 745, 60, 55, 15)
    }

    // left player tiles facedown
    for (let i = 0; i < board['left'].tiles_in_hand.length; i++) {
        ctx.drawImage(tile_fd_shifted, 20, i * 36 + 65, 48, 36)
    }

    //left player hua
    for (var p = 0; p < board['left'].hua_array.length; p++) {
        num_to_pic_rotated_left(board['left'].hua_array[p], 110 + p * 30, 460, 30, 40)
    }
    p2 = p * 30 + 110
    for (var p = 0; p < board['left'].tiles_in_board.length; p++) {
        num_to_pic_rotated_left(board['left'].tiles_in_board[p], p * 30 + p2, 460, 30, 40)

    }
    //left tile discarded, if available
    if (board['left'].discard_tile != null) {
        ctx.drawImage(red_circle, 158, 386, 60, 80)
        num_to_pic(board['left'].discard_tile[0], 170, 400) 
    }
    
    //left player chips
    ctx.strokeText(board['left'].username + "'s (left)", 18, 557)
    ctx.strokeText("points:", 36, 574)
    ctx.strokeText(board['left'].chips.toString(), 40, 592)

    //dealer dice
    if (board["left"].id == banker) {
        ctx.drawImage(red_dice_h, 0, 525, 55, 15)
    }
}

//green background cannot be preloaded as it needs to appear as soon as the page loads.
function loadAndDrawImage(url) {
    // Create an image object. This is not attached to the DOM and is not part of the page.
    var image = new Image();
    // When the image has loaded, draw it to the canvas
    image.onload = function () {
        ctx.drawImage(image, 0, 0, 800, 600)
    }

    // Now set the source of the image that we want to load
    image.src = url;
}

function draw_tile(board){
    
    // Checks for 15 tiles left
    if (new Set(board['all']).size <= 16){
        socket.emit('end_game_to_server', socket.id, board['own'], client_room_num)
    }

    if (board['own'].tiles_in_hand.length >= 14){
        return
    }
     //get random tile from all tiles that is not already drawn
     var possible_tile = getRandomInt(0, 148)
    
     while (board['all'][possible_tile] == 200){
       possible_tile = getRandomInt(0, 148)
     }
    
     board['all'][possible_tile] = 200
     board['own'].tiles_in_hand.push(possible_tile)
    

     // chong bu if tile drawn is hua/ own gang
     while (board['own'].tiles_in_hand[board['own'].tiles_in_hand.length -1] >= 136 || draw_gang(board['own'].tiles_in_board, board['own'].tiles_in_hand)){ //if tile is hua (will continue to chongbu)
        
        if (new Set(board['all']).size <= 16){
            socket.emit('end_game_to_server', socket.id, board['own'], client_room_num)
        }

         // first case(hua)
         if (board['own'].tiles_in_hand[board['own'].tiles_in_hand.length -1] >= 136){
         board['own'].hua_array.push(board['own'].tiles_in_hand[board['own'].tiles_in_hand.length -1]);//push hua onto hua_array
         
        }

         // 2nd case (gang)
         else{
         board['own'].tiles_in_board.push(board['own'].tiles_in_hand[board['own'].tiles_in_hand.length -1]); //push gang onto board
         
        }
         
         board['own'].tiles_in_hand.pop()

         var x = getRandomInt(0, 148); //get random int
        
         while (board['all'][x] == 200){ //get valid tile (which is not already taken to replace hua)
           var x = getRandomInt(0, 148);
         }

         board['own'].tiles_in_hand.push(x); //update hua tile to this tile
         
         board['all'][x] = 200; //change tile in alltiles to be taken
     }
}

function draw_gang(board, hand){
    if (board.length == 0){
        return false
    }
    var draw = hand[hand.length - 1]
    var counter = 1

    for (let i = 0; i < board.length; i++){
        if (magic(board[i]) == magic(draw)){
            counter ++
        }
    }

    if (counter == 4){
        return true
    }

    return false
}


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    }



function make_discard(number){
    if (socket.id == player_turn && discard == true && number <= board['own'].tiles_in_hand.length - 1){
        discard = false
        console.log('discarding')
        board['own'].discard_tile = board['own'].tiles_in_hand.splice(number, 1)
        board['own'].tiles_in_hand.sort(function(a, b){return a-b})
        socket.emit('discard_to_server', board['own'], socket.id, board['right'], board['opposite'], board['left'], board['all'], own_index, prevailing_wind, right_id, opposite_id, left_id, client_room_num)
    }
    else return
}

function make_peng(){
  if (socket.id != player_turn && peng != false){
      var match_tiles = can_peng(board['own'].tiles_in_hand, peng[0])
      if (match_tiles != false){
          clearTimeout(id_peng)
          var index = board['own'].tiles_in_hand.indexOf(match_tiles[1])
          board['own'].tiles_in_hand.splice(index, 2)
          
          for (let i = 0; i < 3; i++){
          board['own'].tiles_in_board.push(peng[0])
          }
          peng = false
          socket.emit('peng_to_server', board['own'], socket.id, client_room_num)
      }
  }
}

function can_peng(li, discard) {
    let counter = 0
    var match_tiles = [discard]
    for (let i = 0; i < li.length; i++) {
        if (magic(li[i]) == magic(discard)) {
            counter++
            match_tiles.push(li[i])
            if (counter == 2) {
                return match_tiles
            }
        }
    }
    

    return false
}

function can_gang(tiles_in_hand, discard) {
    let counter = 0
    var match_tiles = [discard]
    
    for (let i = 0; i < tiles_in_hand.length; i++) {
        if (magic(tiles_in_hand[i]) == magic(discard)) {
            counter++
            match_tiles.push(tiles_in_hand[i])

            if (counter == 3) {
                return match_tiles
            }
        }
    }
    

    return false
}

function is_valid_gang(li) {
    const one = magic(li[0])
    const two = magic(li[1])
    const three = magic(li[2])
    const four = magic(li[3])

    return one == two && two == three && three == four
}


function magic(num) {
    return Math.floor(num / 4)
}

function can_chi(direction){
    var to_check = magic(chi[0])
    if (chi == false || to_check >= 27 ){
        return false
    }

    var output = []
    if (direction == 'left'){
       
        if(to_check == 7 || to_check == 8 || to_check == 16 || to_check == 17 || to_check >= 25){
           return false
        } 

       output.push(chi[0])
       for (let i = 0; i < board['own'].tiles_in_hand.length; i++){
            if (magic(board['own'].tiles_in_hand[i]) == to_check + 1){
                output.push(board['own'].tiles_in_hand[i])
                
                break
            }
       }
        for (let i = 0; i < board['own'].tiles_in_hand.length; i++){
            if (magic(board['own'].tiles_in_hand[i]) == to_check + 2){
                output.push(board['own'].tiles_in_hand[i])
                break
            }
        }

        if (output.length == 3){
            return output
        }

        return false
    }

    if (direction == 'center'){
        if(to_check == 0||to_check == 8 || to_check == 9 ||to_check == 17 || to_check == 18 ||to_check == 26){
            return false
        }

        for (let i = 0; i < board['own'].tiles_in_hand.length; i++) {
            if (magic(board['own'].tiles_in_hand[i]) == to_check - 1) {
                output.push(board['own'].tiles_in_hand[i])
                break
            }
        }
        output.push(chi[0])

        for (let i = 0; i < board['own'].tiles_in_hand.length; i++){
            if (magic(board['own'].tiles_in_hand[i]) == to_check + 1){
                output.push(board['own'].tiles_in_hand[i])
                break
            }
        }

        if (output.length == 3){
            return output
        }
        
        return false
    }

    if (direction == 'right'){
       
        if(to_check == 0 || to_check == 1 || to_check == 9 || to_check == 10 || to_check == 18 || to_check == 19){
           return false
        } 

       for (let i = 0; i < board['own'].tiles_in_hand.length; i++){
            if (magic(board['own'].tiles_in_hand[i]) == to_check - 2){
                output.push(board['own'].tiles_in_hand[i])
                break
            }
       }
        for (let i = 0; i < board['own'].tiles_in_hand.length; i++){
            if (magic(board['own'].tiles_in_hand[i]) == to_check - 1){
                output.push(board['own'].tiles_in_hand[i])
                break
            }
        }

        output.push(chi[0])
        if (output.length == 3){
            return output
        }
        return false
    }
}

function make_chi(direction){
    var to_check = magic(chi[0])
    if (chi == false || to_check >= 27 ){
        return
    }
    
    var output = []
    if (direction == 'left'){
       
        if(to_check == 7 || to_check == 8 || to_check == 16 || to_check == 17 || to_check >= 25){
           return
        } 

        output.push(chi[0])
       for (let i = 0; i < board['own'].tiles_in_hand.length; i++){
            if (magic(board['own'].tiles_in_hand[i]) == to_check + 1){
                output.push(board['own'].tiles_in_hand[i])
                var second = i
                break
            }
       }
        for (let i = 0; i < board['own'].tiles_in_hand.length; i++){
            if (magic(board['own'].tiles_in_hand[i]) == to_check + 2){
                output.push(board['own'].tiles_in_hand[i])
                var third = i
                break
            }
        }

        if (output.length == 3){
            clearTimeout(id_chi)
            clearTimeout(id_peng)
            board['own'].tiles_in_hand.splice(second, 1)
            board['own'].tiles_in_hand.splice(third - 1, 1)
            board['own'].tiles_in_board.push(chi[0], chi[0] + 4, chi[0] + 8)
            chi = false
            socket.emit('chi_to_server', board['own'], socket.id, client_room_num)
            
        }
    }

    if (direction == 'center'){
        if(to_check == 0||to_check == 8 || to_check == 9 ||to_check == 17 || to_check == 18 ||to_check == 26){
            return
        }

        for (let i = 0; i < board['own'].tiles_in_hand.length; i++) {
            if (magic(board['own'].tiles_in_hand[i]) == to_check - 1) {
                output.push(board['own'].tiles_in_hand[i])
                var first = i
                break
            }
        }
        output.push(chi[0])

        for (let i = 0; i < board['own'].tiles_in_hand.length; i++){
            if (magic(board['own'].tiles_in_hand[i]) == to_check + 1){
                output.push(board['own'].tiles_in_hand[i])
                var third = i
                break
            }
        }
        
        if (output.length == 3){
            clearTimeout(id_chi)
            clearTimeout(id_peng)
            board['own'].tiles_in_hand.splice(first, 1)
            board['own'].tiles_in_hand.splice(third - 1, 1)
            board['own'].tiles_in_board.push(chi[0] - 4, chi[0], chi[0] + 4)
            chi = false
            socket.emit('chi_to_server', board['own'], socket.id, client_room_num)
        }
    

    }

    if (direction == 'right'){

        if(to_check == 0 || to_check == 1 || to_check == 9 || to_check == 10 || to_check == 18 || to_check == 19){
           return
        } 

       for (let i = 0; i < board['own'].tiles_in_hand.length; i++){
            if (magic(board['own'].tiles_in_hand[i]) == to_check - 2){
                output.push(board['own'].tiles_in_hand[i])
                var first = i
                break
            }
       }
        for (let i = 0; i < board['own'].tiles_in_hand.length; i++){
            if (magic(board['own'].tiles_in_hand[i]) == to_check - 1){
                output.push(board['own'].tiles_in_hand[i])
                var second = i
                break
            }
        }

        output.push(chi[0])
        if (output.length == 3){
            clearTimeout(id_chi)
            clearTimeout(id_peng)
            board['own'].tiles_in_hand.splice(first, 1)
            board['own'].tiles_in_hand.splice(second - 1, 1)
            board['own'].tiles_in_board.push(chi[0] - 8, chi[0] - 4, chi[0])
            chi = false
            socket.emit('chi_to_server', board['own'], socket.id, client_room_num)
        }
    }
}

function make_gang(){
    // an gang
    if (player_turn == socket.id){
        
        var last_tile_index = board['own'].tiles_in_hand.length - 1
        var last_tile = board['own'].tiles_in_hand[last_tile_index]
        var counter = 0
        var match_tiles = []
        
        // find valid gang (drawn)
        for (let i = 0; i < board['own'].tiles_in_hand.length; i++){
            
            if (magic(board['own'].tiles_in_hand[i]) == magic(last_tile)){
                counter ++ 
                match_tiles.push(board['own'].tiles_in_hand[i])
            }
        }

        // valid gang found
        if (counter >= 4){
            clearTimeout(id_chi)
            clearTimeout(id_peng)
            var index = board['own'].tiles_in_hand.indexOf(match_tiles[0])
            
            // remove tile drawn
            board['own'].tiles_in_hand.pop()
            
            // remove tile in hand
            board['own'].tiles_in_hand.splice(index, 3)
            
            // push to board 4 times
            for (let i = 0; i < 4; i++){
            board['own'].tiles_in_board.push(match_tiles[0])
            }
            
            draw_tile(board)
            update_board(board)           
            socket.emit('gang_to_server', board['own'], own_index, prevailing_wind, socket.id, board['all'], client_room_num, 'normal')
            return
        }

        // find valid gang originally in hand

        for (let i = 0; i < board['own'].tiles_in_hand.length - 3; i++){
            if (magic(board['own'].tiles_in_hand[i]) == magic(board['own'].tiles_in_hand[i + 3])){
                clearTimeout(id_chi)
                clearTimeout(id_peng)
                for (let j = 0; j < 4; j++){
                    board['own'].tiles_in_board.push(board['own'].tiles_in_hand[i])
                }
                board['own'].tiles_in_hand.splice(i, 4)
                draw_tile(board)
                update_board(board)           
                socket.emit('gang_to_server', board['own'], own_index, prevailing_wind, socket.id, board['all'], client_room_num, 'normal')
                return
            }    
        }
    }

    // ming gang (Not your turn/ someone has discard/ Peng is true)
    else if (socket.id != player_turn && board[orientation[player_turn]].discard_tile != null && peng != false){
        
        var match_tiles = can_gang(board['own'].tiles_in_hand, peng[0])
        
        if (match_tiles != false){
            clearTimeout(id_chi)
            clearTimeout(id_peng)
            var index = board['own'].tiles_in_hand.indexOf(match_tiles[1])
            
            

            // 3 instead of 2 for gang
            board['own'].tiles_in_hand.splice(index, 3)
            
            for (let i = 0; i < 3; i++){
            board['own'].tiles_in_board.push(peng[0])
            }

            board['own'].tiles_in_board.push(match_tiles[1])
            
            peng = false
            draw_tile(board)
            update_board(board)
            
            socket.emit('gang_to_server', board['own'], own_index, prevailing_wind, socket.id, board['all'], client_room_num,'special')     
        }

    }

    else return

}




function hu(){
    if (round == true && round_end == false){
        round_end = true
        if (player_turn != socket.id){
        board['own'].tiles_in_hand.push(board[orientation[player_turn]].discard_tile[0])
        }
        console.log('hu')

        socket.emit('round_won_to_server', socket.id, board['own'], client_room_num)
    }
    else return
}

function load(players){

board['own'] = {tiles_in_hand: players[own_id].tiles_in_hand,
        tiles_in_board: [],
        hua_array: players[own_id].hua_array,
        discard_tile: null,
        chips: players[own_id].chip_count,
        id: players[own_id].id,
        username: players[own_id].username}

board['right'] = {tiles_in_hand: players[right_id].tiles_in_hand,
         tiles_in_board: [],
         hua_array: players[right_id].hua_array,
        discard_tile: null,
        chips: players[right_id].chip_count,
        id: players[right_id].id,
        username: players[right_id].username}
         
    board['opposite'] = {
        tiles_in_hand: players[opposite_id].tiles_in_hand,
        tiles_in_board: [],
        hua_array: players[opposite_id].hua_array,
        discard_tile: null,
        chips: players[opposite_id].chip_count,
        id: players[opposite_id].id,
        username: players[opposite_id].username
    }

board['left'] = {tiles_in_hand: players[left_id].tiles_in_hand,
       tiles_in_board: [],
       hua_array: players[left_id].hua_array,
       discard_tile: null,
       chips: players[left_id].chip_count,
       id: players[left_id].id,
       username: players[left_id].username}

board['all'] =  players[own_id].all_tiles
board['discard_pile'] = []

}

function reload(players){

    board['own'].tiles_in_hand = players[own_id].tiles_in_hand
    board['own'].tiles_in_board = []
    board['own'].hua_array = players[own_id].hua_array
    board['own'].discard_tile = null

    board['right'].tiles_in_hand = players[right_id].tiles_in_hand
    board['right'].tiles_in_board = []
    board['right'].hua_array = players[right_id].hua_array
    board['right'].discard_tile = null
    

    


    board['opposite'].tiles_in_hand = players[opposite_id].tiles_in_hand
    board['opposite'].tiles_in_board = []
    board['opposite'].hua_array = players[opposite_id].hua_array
    board['opposite'].discard_tile = null

    board['left'].tiles_in_hand = players[left_id].tiles_in_hand
    board['left'].tiles_in_board = []
    board['left'].hua_array = players[left_id].hua_array
    board['left'].discard_tile = null
    
    board['all'] =  players[own_id].all_tiles
    board['discard_pile'] = []

    player_turn = null;
    discard = false;
    peng = false;
    chi = false;
    id_peng = null; 
    id_chi = null; 
    round = null;
    round_end = false
    
}

//function to change number to print tile onto canvas with x and y axis (not rotated)
function num_to_pic(num, x, y) {
    if (num < 136) {
        switch (magic(num)) {
            case 0:
                ctx.drawImage(one_tong, x, y, 36, 48)
                break;
            case 1:
                ctx.drawImage(two_tong, x, y, 36, 48)
                break;
            case 2:
                ctx.drawImage(three_tong, x, y, 36, 48)
                break;
            case 3:
                ctx.drawImage(four_tong, x, y, 36, 48)
                break;
            case 4:
                ctx.drawImage(five_tong, x, y, 36, 48)
                break;
            case 5:
                ctx.drawImage(six_tong, x, y, 36, 48)
                break;
            case 6:
                ctx.drawImage(seven_tong, x, y, 36, 48)
                break;
            case 7:
                ctx.drawImage(eight_tong, x, y, 36, 48)
                break;
            case 8:
                ctx.drawImage(nine_tong, x, y, 36, 48)
                break;
            case 9:
                ctx.drawImage(one_bamboo, x, y, 36, 48)
                break;
            case 10:
                ctx.drawImage(two_bamboo, x, y, 36, 48)
                break;
            case 11:
                ctx.drawImage(three_bamboo, x, y, 36, 48)
                break;
            case 12:
                ctx.drawImage(four_bamboo, x, y, 36, 48)
                break;
            case 13:
                ctx.drawImage(five_bamboo, x, y, 36, 48)
                break;
            case 14:
                ctx.drawImage(six_bamboo, x, y, 36, 48)
                break;
            case 15:
                ctx.drawImage(seven_bamboo, x, y, 36, 48)
                break;
            case 16:
                ctx.drawImage(eight_bamboo, x, y, 36, 48)
                break;
            case 17:
                ctx.drawImage(nine_bamboo, x, y, 36, 48)
                break;
            case 18:
                ctx.drawImage(one_wan, x, y, 36, 48)
                break;
            case 19:
                ctx.drawImage(two_wan, x, y, 36, 48)
                break;
            case 20:
                ctx.drawImage(three_wan, x, y, 36, 48)
                break;
            case 21:
                ctx.drawImage(four_wan, x, y, 36, 48)
                break;
            case 22:
                ctx.drawImage(five_wan, x, y, 36, 48)
                break;
            case 23:
                ctx.drawImage(six_wan, x, y, 36, 48)
                break;
            case 24:
                ctx.drawImage(seven_wan, x, y, 36, 48)
                break;
            case 25:
                ctx.drawImage(eight_wan, x, y, 36, 48)
                break;
            case 26:
                ctx.drawImage(nine_wan, x, y, 36, 48)
                break;
            case 27:
                ctx.drawImage(red_dragon, x, y, 36, 48)
                break;
            case 28:
                ctx.drawImage(white_dragon, x, y, 36, 48)
                break;
            case 29:
                ctx.drawImage(green_dragon, x, y, 36, 48)
                break;
            case 30:
                ctx.drawImage(dong_pic, x, y, 36, 48)
                break;
            case 31:
                ctx.drawImage(nan_pic, x, y, 36, 48)
                break;
            case 32:
                ctx.drawImage(xi_pic, x, y, 36, 48)
                break;
            case 33:
                ctx.drawImage(bei_pic, x, y, 36, 48)
                break;

        }
    }
    else {
        switch (num) {
            case 136:
                ctx.drawImage(red_1_flower, x, y, 36, 48)
                break;
            case 137:
                ctx.drawImage(blue_1_flower, x, y, 36, 48)
                break;
            case 138:
                ctx.drawImage(red_2_flower, x, y, 36, 48)
                break;
            case 139:
                ctx.drawImage(blue_2_flower, x, y, 36, 48)
                break;
            case 140:
                ctx.drawImage(red_3_flower, x, y, 36, 48)
                break;
            case 141:
                ctx.drawImage(blue_3_flower, x, y, 36, 48)
                break;
            case 142:
                ctx.drawImage(red_4_flower, x, y, 36, 48)
                break;
            case 143:
                ctx.drawImage(blue_4_flower, x, y, 36, 48)
                break;
            case 144:
                ctx.drawImage(cat, x, y, 36, 48)
                break;
            case 145:
                ctx.drawImage(mouse, x, y, 36, 48)
                break;
            case 146:
                ctx.drawImage(chicken, x, y, 36, 48)
                break;
            case 147:
                ctx.drawImage(caterpillar, x, y, 36, 48)
                break;
        }
    }
    
}

function num_to_pic_rotated_left(num, x, y, sizex, sizey) {
    if (num < 136) {
        switch (magic(num)) {
            case 0:
                draw_rotated_tile_left(one_tong, x, y, sizex, sizey)
                break;
            case 1:
                draw_rotated_tile_left(two_tong, x, y, sizex, sizey)
                break;
            case 2:
                draw_rotated_tile_left(three_tong, x, y, sizex, sizey)
                break;
            case 3:
                draw_rotated_tile_left(four_tong, x, y, sizex, sizey)
                break;
            case 4:
                draw_rotated_tile_left(five_tong, x, y, sizex, sizey)
                break;
            case 5:
                draw_rotated_tile_left(six_tong, x, y, sizex, sizey)
                break;
            case 6:
                draw_rotated_tile_left(seven_tong, x, y, sizex, sizey)
                break;
            case 7:
                draw_rotated_tile_left(eight_tong, x, y, sizex, sizey)
                break;
            case 8:
                draw_rotated_tile_left(nine_tong, x, y, sizex, sizey)
                break;
            case 9:
                draw_rotated_tile_left(one_bamboo, x, y, sizex, sizey)
                break;
            case 10:
                draw_rotated_tile_left(two_bamboo, x, y, sizex, sizey)
                break;
            case 11:
                draw_rotated_tile_left(three_bamboo, x, y, sizex, sizey)
                break;
            case 12:
                draw_rotated_tile_left(four_bamboo, x, y, sizex, sizey)
                break;
            case 13:
                draw_rotated_tile_left(five_bamboo, x, y, sizex, sizey)
                break;
            case 14:
                draw_rotated_tile_left(six_bamboo, x, y, sizex, sizey)
                break;
            case 15:
                draw_rotated_tile_left(seven_bamboo, x, y, sizex, sizey)
                break;
            case 16:
                draw_rotated_tile_left(eight_bamboo, x, y, sizex, sizey)
                break;
            case 17:
                draw_rotated_tile_left(nine_bamboo, x, y, sizex, sizey)
                break;
            case 18:
                draw_rotated_tile_left(one_wan, x, y, sizex, sizey)
                break;
            case 19:
                draw_rotated_tile_left(two_wan, x, y, sizex, sizey)
                break;
            case 20:
                draw_rotated_tile_left(three_wan, x, y, sizex, sizey)
                break;
            case 21:
                draw_rotated_tile_left(four_wan, x, y, sizex, sizey)
                break;
            case 22:
                draw_rotated_tile_left(five_wan, x, y, sizex, sizey)
                break;
            case 23:
                draw_rotated_tile_left(six_wan, x, y, sizex, sizey)
                break;
            case 24:
                draw_rotated_tile_left(seven_wan, x, y, sizex, sizey)
                break;
            case 25:
                draw_rotated_tile_left(eight_wan, x, y, sizex, sizey)
                break;
            case 26:
                draw_rotated_tile_left(nine_wan, x, y, sizex, sizey)
                break;
            case 27:
                draw_rotated_tile_left(red_dragon, x, y, sizex, sizey)
                break;
            case 28:
                draw_rotated_tile_left(white_dragon, x, y, sizex, sizey)
                break;
            case 29:
                draw_rotated_tile_left(green_dragon, x, y, sizex, sizey)
                break;
            case 30:
                draw_rotated_tile_left(dong_pic, x, y, sizex, sizey)
                break;
            case 31:
                draw_rotated_tile_left(nan_pic, x, y, sizex, sizey)
                break;
            case 32:
                draw_rotated_tile_left(xi_pic, x, y, sizex, sizey)
                break;
            case 33:
                draw_rotated_tile_left(bei_pic, x, y, sizex, sizey)
                break;

        }
    }
    else {
        switch (num) {
            case 136:
                draw_rotated_tile_left(red_1_flower, x, y, sizex, sizey)
                break;
            case 137:
                draw_rotated_tile_left(blue_1_flower, x, y, sizex, sizey)
                break;
            case 138:
                draw_rotated_tile_left(red_2_flower, x, y, sizex, sizey)
                break;
            case 139:
                draw_rotated_tile_left(blue_2_flower, x, y, sizex, sizey)
                break;
            case 140:
                draw_rotated_tile_left(red_3_flower, x, y, sizex, sizey)
                break;
            case 141:
                draw_rotated_tile_left(blue_3_flower, x, y, sizex, sizey)
                break;
            case 142:
                draw_rotated_tile_left(red_4_flower, x, y, sizex, sizey)
                break;
            case 143:
                draw_rotated_tile_left(blue_4_flower, x, y, sizex, sizey)
                break;
            case 144:
                draw_rotated_tile_left(cat, x, y, sizex, sizey)
                break;
            case 145:
                draw_rotated_tile_left(mouse, x, y, sizex, sizey)
                break;
            case 146:
                draw_rotated_tile_left(chicken, x, y, sizex, sizey)
                break;
            case 147:
                draw_rotated_tile_left(caterpillar, x, y, sizex, sizey)
                break;
        }
    }

}

function num_to_pic_rotated_right(num, x, y, sizex, sizey) {
    if (num < 136) {
        switch (magic(num)) {
            case 0:
                draw_rotated_tile_right(one_tong, x, y, sizex, sizey)
                break;
            case 1:
                draw_rotated_tile_right(two_tong, x, y, sizex, sizey)
                break;
            case 2:
                draw_rotated_tile_right(three_tong, x, y, sizex, sizey)
                break;
            case 3:
                draw_rotated_tile_right(four_tong, x, y, sizex, sizey)
                break;
            case 4:
                draw_rotated_tile_right(five_tong, x, y, sizex, sizey)
                break;
            case 5:
                draw_rotated_tile_right(six_tong, x, y, sizex, sizey)
                break;
            case 6:
                draw_rotated_tile_right(seven_tong, x, y, sizex, sizey)
                break;
            case 7:
                draw_rotated_tile_right(eight_tong, x, y, sizex, sizey)
                break;
            case 8:
                draw_rotated_tile_right(nine_tong, x, y, sizex, sizey)
                break;
            case 9:
                draw_rotated_tile_right(one_bamboo, x, y, sizex, sizey)
                break;
            case 10:
                draw_rotated_tile_right(two_bamboo, x, y, sizex, sizey)
                break;
            case 11:
                draw_rotated_tile_right(three_bamboo, x, y, sizex, sizey)
                break;
            case 12:
                draw_rotated_tile_right(four_bamboo, x, y, sizex, sizey)
                break;
            case 13:
                draw_rotated_tile_right(five_bamboo, x, y, sizex, sizey)
                break;
            case 14:
                draw_rotated_tile_right(six_bamboo, x, y, sizex, sizey)
                break;
            case 15:
                draw_rotated_tile_right(seven_bamboo, x, y, sizex, sizey)
                break;
            case 16:
                draw_rotated_tile_right(eight_bamboo, x, y, sizex, sizey)
                break;
            case 17:
                draw_rotated_tile_right(nine_bamboo, x, y, sizex, sizey)
                break;
            case 18:
                draw_rotated_tile_right(one_wan, x, y, sizex, sizey)
                break;
            case 19:
                draw_rotated_tile_right(two_wan, x, y, sizex, sizey)
                break;
            case 20:
                draw_rotated_tile_right(three_wan, x, y, sizex, sizey)
                break;
            case 21:
                draw_rotated_tile_right(four_wan, x, y, sizex, sizey)
                break;
            case 22:
                draw_rotated_tile_right(five_wan, x, y, sizex, sizey)
                break;
            case 23:
                draw_rotated_tile_right(six_wan, x, y, sizex, sizey)
                break;
            case 24:
                draw_rotated_tile_right(seven_wan, x, y, sizex, sizey)
                break;
            case 25:
                draw_rotated_tile_right(eight_wan, x, y, sizex, sizey)
                break;
            case 26:
                draw_rotated_tile_right(nine_wan, x, y, sizex, sizey)
                break;
            case 27:
                draw_rotated_tile_right(red_dragon, x, y, sizex, sizey)
                break;
            case 28:
                draw_rotated_tile_right(white_dragon, x, y, sizex, sizey)
                break;
            case 29:
                draw_rotated_tile_right(green_dragon, x, y, sizex, sizey)
                break;
            case 30:
                draw_rotated_tile_right(dong_pic, x, y, sizex, sizey)
                break;
            case 31:
                draw_rotated_tile_right(nan_pic, x, y, sizex, sizey)
                break;
            case 32:
                draw_rotated_tile_right(xi_pic, x, y, sizex, sizey)
                break;
            case 33:
                draw_rotated_tile_right(bei_pic, x, y, sizex, sizey)
                break;

        }
    }
    else {
        switch (num) {
            case 136:
                draw_rotated_tile_right(red_1_flower, x, y, sizex, sizey)
                break;
            case 137:
                draw_rotated_tile_right(blue_1_flower, x, y, sizex, sizey)
                break;
            case 138:
                draw_rotated_tile_right(red_2_flower, x, y, sizex, sizey)
                break;
            case 139:
                draw_rotated_tile_right(blue_2_flower, x, y, sizex, sizey)
                break;
            case 140:
                draw_rotated_tile_right(red_3_flower, x, y, sizex, sizey)
                break;
            case 141:
                draw_rotated_tile_right(blue_3_flower, x, y, sizex, sizey)
                break;
            case 142:
                draw_rotated_tile_right(red_4_flower, x, y, sizex, sizey)
                break;
            case 143:
                draw_rotated_tile_right(blue_4_flower, x, y, sizex, sizey)
                break;
            case 144:
                draw_rotated_tile_right(cat, x, y, sizex, sizey)
                break;
            case 145:
                draw_rotated_tile_right(mouse, x, y, sizex, sizey)
                break;
            case 146:
                draw_rotated_tile_right(chicken, x, y, sizex, sizey)
                break;
            case 147:
                draw_rotated_tile_right(caterpillar, x, y, sizex, sizey)
                break;
        }
    }

}
function draw_rotated_tile_left(image, x, y, sizex, sizey) {
    ctx.translate(600,0);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(image, x, y, sizex, sizey);
    ctx.rotate(-90 * Math.PI / 180);
    ctx.translate(-600, 0);
}
function draw_rotated_tile_right(image, x, y, sizex, sizey) {
    ctx.translate(200, 600);
    ctx.rotate(-90 * Math.PI / 180);
    ctx.drawImage(image, x, y, sizex, sizey);
    ctx.rotate(90 * Math.PI / 180);
    ctx.translate(-200, -600);
}

//when someone wins, display all tiles
function round_end_display(board) {
    var image = new Image();
    image.src = "https://mcdn.wallpapersafari.com/medium/73/10/VCIq0j.jpg"
    ctx.drawImage(image, 0, 0, 800, 600)
    
    ctx.drawImage(end_game_tai, 150, 220, 509, 216)
    var i = 0
    for (var j = 0; j < payout_info.length; j++) {
        if (payout_info[j] == '') {
            continue
        }
        else {
            switch (payout_info[j]) {
                case 'animal':
                    ctx.strokeText("Animal tile: 1 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'player_own_hua':
                    ctx.strokeText("Own flower 花: 1 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'red_dragon':
                    ctx.strokeText("Red dragon 红中： 1 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'white_dragon':
                    ctx.strokeText("White dragon 白板: 1 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'green_dragon':
                    ctx.strokeText("Green dragon 发财: 1 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'player_wind':
                    ctx.strokeText("Own wind peng: 1 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'prevailing_wind':
                    ctx.strokeText("Prevailing wind peng: 1 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'chou_ping_hu':
                    ctx.strokeText("Chou ping hu 臭平胡: 1 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'ping_hu':
                    ctx.strokeText("Ping hu 平胡: 4 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'dui_dui':
                    ctx.strokeText("Dui dui peng 对对碰: 2 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'one_nine_half':
                    ctx.strokeText("One-nine half 混老头·: 2 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'one_nine':
                    ctx.strokeText("One-nine 清老头·: 4 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'ban_se':
                    ctx.strokeText("Ban se 半色: 2 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'yi_se':
                    ctx.strokeText("Yi se 清一色: 4 tai", 360, 255 + i * 20)
                    i++
                    break;
                case 'thirteen_wonder':
                    ctx.strokeText("Thirteen wonders 十三幺: 5 tai", 360, 255 + i * 20)
                    i++
                    break;
            }
        }
    }
    //displays prevailing wind just above own chip count
    switch (prevailing_wind) {
        case 0:
            ctx.drawImage(dong_pic, 680, 508, 24, 32)
            break;
        case 1:
            ctx.drawImage(nan_pic, 680, 508, 24, 32)
            break;
        case 2:
            ctx.drawImage(xi_pic, 680, 508, 24, 32)
            break;
        case 3:
            ctx.drawImage(bei_pic, 680, 508, 24, 32)
            break;
    }
    ctx.lineWidth = "1";
    ctx.rect(0, 540, 120, 60);
    ctx.fillStyle = "white"
    ctx.fill();

    ctx.rect(680, 540, 120, 60);
    ctx.fillStyle = "white"
    ctx.fill();

    ctx.rect(0, 0, 120, 60);
    ctx.fillStyle = "white"
    ctx.fill();

    ctx.rect(680, 0, 120, 60);
    ctx.fillStyle = "white"
    ctx.fill();

    //own tiles
    for (var i = 0; i < board['own'].tiles_in_hand.length; i++) {
        let current_tile = board['own'].tiles_in_hand[i] //tile no.
        num_to_pic(current_tile, (i + 1) * 36 + 120, 550)
    }

    //own hua
    for (var x = 0; x < board['own'].tiles_in_board.length; x++) {
        var x1 = (x + 1) * 36 + 150
        num_to_pic(board['own'].tiles_in_board[x], x1, 480)
    }
    var x_coord = (board['own'].tiles_in_board.length + 1) * 36 + 150

    for (var x = 0; x < board['own'].hua_array.length; x++) {
        num_to_pic(board['own'].hua_array[x], x_coord + (x * 36), 480)
    }
    //own discard
    if (board['own'].discard_tile != null) {
        ctx.drawImage(red_circle, 568, 426, 60, 80)
        num_to_pic(board['own'].discard_tile[0], 580, 440)
    }
    //own chips
    ctx.strokeText("Your points:", 700, 565)
    ctx.strokeText(board['own'].chips.toString(), 720, 585)

    //dealer dice
    if (socket.id == banker) {
        ctx.drawImage(red_dice_v, 665, 545, 15, 55)
    }

    // Opp player tiles
    for (var i = 0; i < board['opposite'].tiles_in_hand.length; i++) {
        num_to_pic(board['opposite'].tiles_in_hand[i], i * 36 + 170, 30, 36, 48)
    }

    //opp player hua
    for (var p = 0; p < board['opposite'].hua_array.length; p++) {
        num_to_pic(board['opposite'].hua_array[p], p * 36 + 175, 100)

    }
    p2 = p * 36 + 175
    for (var p = 0; p < board['opposite'].tiles_in_board.length; p++) {
        num_to_pic(board['opposite'].tiles_in_board[p], p * 36 + p2, 100)

    }

    // Opp player discard
    if (board['opposite'].discard_tile != null) {
        ctx.drawImage(red_circle, 188, 156, 60, 80)
        num_to_pic(board['opposite'].discard_tile[0], 200, 170)
    }
    //opp player chips
    ctx.strokeText("Opp. points:", 25, 25)
    ctx.strokeText(board['opposite'].chips.toString(), 40, 45)

    //dealer dice
    if (board["opposite"].id == banker) {
        ctx.drawImage(red_dice_v, 120, 0, 15, 55)
    }

    // right player tiles faceUP
    for (let i = 0; i < board['right'].tiles_in_hand.length; i++) {
        num_to_pic_rotated_right(board['right'].tiles_in_hand[i], i * 30 + 70, 540, 36, 48)
    }

    //right player hua
    for (var p = 0; p < board['right'].hua_array.length; p++) {
        num_to_pic_rotated_right(board['right'].hua_array[p], 110 + p * 30, 480, 30, 40)

    }
    p2 = p * 30 + 110
    for (var p = 0; p < board['right'].tiles_in_board.length; p++) {
        num_to_pic_rotated_right(board['right'].tiles_in_board[p], p * 30 + p2, 480, 30, 40)

    }
    //right tile discarded, if available
    if (board['right'].discard_tile != null) {
        ctx.drawImage(red_circle, 588, 186, 60, 80)
        num_to_pic(board['right'].discard_tile[0], 600, 200, 90)
    }
    //right player chips
    ctx.strokeText("Right points:", 700, 25)
    ctx.strokeText(board['right'].chips.toString(), 720, 45)

    //dealer dice
    if (board["right"].id == banker) {
        ctx.drawImage(red_dice_h, 745, 60, 55, 15)
    }

    // left player tiles faceUP
    for (let i = 0; i < board['left'].tiles_in_hand.length; i++) {
        num_to_pic_rotated_left(board['left'].tiles_in_hand[i], i * 30 + 70, 532, 30, 40)
    }

    //left player hua
    for (var p = 0; p < board['left'].hua_array.length; p++) {
        num_to_pic_rotated_left(board['left'].hua_array[p], 110 + p * 30, 460, 30, 40)
    }
    p2 = p * 30 + 110
    for (var p = 0; p < board['left'].tiles_in_board.length; p++) {
        num_to_pic_rotated_left(board['left'].tiles_in_board[p], p * 30 + p2, 460, 30, 40)

    }
    //left tile discarded, if available
    if (board['left'].discard_tile != null) {
        ctx.drawImage(red_circle, 158, 386, 60, 80)
        num_to_pic(board['left'].discard_tile[0], 170, 400)
    }
    //left player chips
    ctx.strokeText("Left points:", 25, 565)
    ctx.strokeText(board['left'].chips.toString(), 40, 585)

    //dealer dice
    if (board["left"].id == banker) {
        ctx.drawImage(red_dice_h, 0, 525, 55, 15)
    }
}

function num_to_pic_smaller(num, x, y) {
    if (num < 136) {
        switch (magic(num)) {
            case 0:
                ctx.drawImage(one_tong, x, y, 30, 40)
                break;
            case 1:
                ctx.drawImage(two_tong, x, y, 30, 40)
                break;
            case 2:
                ctx.drawImage(three_tong, x, y, 30, 40)
                break;
            case 3:
                ctx.drawImage(four_tong, x, y, 30, 40)
                break;
            case 4:
                ctx.drawImage(five_tong, x, y, 30, 40)
                break;
            case 5:
                ctx.drawImage(six_tong, x, y, 30, 40)
                break;
            case 6:
                ctx.drawImage(seven_tong, x, y, 30, 40)
                break;
            case 7:
                ctx.drawImage(eight_tong, x, y, 30, 40)
                break;
            case 8:
                ctx.drawImage(nine_tong, x, y, 30, 40)
                break;
            case 9:
                ctx.drawImage(one_bamboo, x, y, 30, 40)
                break;
            case 10:
                ctx.drawImage(two_bamboo, x, y, 30, 40)
                break;
            case 11:
                ctx.drawImage(three_bamboo, x, y, 30, 40)
                break;
            case 12:
                ctx.drawImage(four_bamboo, x, y, 30, 40)
                break;
            case 13:
                ctx.drawImage(five_bamboo, x, y, 30, 40)
                break;
            case 14:
                ctx.drawImage(six_bamboo, x, y, 30, 40)
                break;
            case 15:
                ctx.drawImage(seven_bamboo, x, y, 30, 40)
                break;
            case 16:
                ctx.drawImage(eight_bamboo, x, y, 30, 40)
                break;
            case 17:
                ctx.drawImage(nine_bamboo, x, y, 30, 40)
                break;
            case 18:
                ctx.drawImage(one_wan, x, y, 30, 40)
                break;
            case 19:
                ctx.drawImage(two_wan, x, y, 30, 40)
                break;
            case 20:
                ctx.drawImage(three_wan, x, y, 30, 40)
                break;
            case 21:
                ctx.drawImage(four_wan, x, y, 30, 40)
                break;
            case 22:
                ctx.drawImage(five_wan, x, y, 30, 40)
                break;
            case 23:
                ctx.drawImage(six_wan, x, y, 30, 40)
                break;
            case 24:
                ctx.drawImage(seven_wan, x, y, 30, 40)
                break;
            case 25:
                ctx.drawImage(eight_wan, x, y, 30, 40)
                break;
            case 26:
                ctx.drawImage(nine_wan, x, y, 30, 40)
                break;
            case 27:
                ctx.drawImage(red_dragon, x, y, 30, 40)
                break;
            case 28:
                ctx.drawImage(white_dragon, x, y, 30, 40)
                break;
            case 29:
                ctx.drawImage(green_dragon, x, y, 30, 40)
                break;
            case 30:
                ctx.drawImage(dong_pic, x, y, 30, 40)
                break;
            case 31:
                ctx.drawImage(nan_pic, x, y, 30, 40)
                break;
            case 32:
                ctx.drawImage(xi_pic, x, y, 30, 40)
                break;
            case 33:
                ctx.drawImage(bei_pic, x, y, 30, 40)
                break;

        }
    }
    else {
        switch (num) {
            case 136:
                ctx.drawImage(red_1_flower, x, y, 30, 40)
                break;
            case 137:
                ctx.drawImage(blue_1_flower, x, y, 30, 40)
                break;
            case 138:
                ctx.drawImage(red_2_flower, x, y, 30, 40)
                break;
            case 139:
                ctx.drawImage(blue_2_flower, x, y, 30, 40)
                break;
            case 140:
                ctx.drawImage(red_3_flower, x, y, 30, 40)
                break;
            case 141:
                ctx.drawImage(blue_3_flower, x, y, 30, 40)
                break;
            case 142:
                ctx.drawImage(red_4_flower, x, y, 30, 40)
                break;
            case 143:
                ctx.drawImage(blue_4_flower, x, y, 30, 40)
                break;
            case 144:
                ctx.drawImage(cat, x, y, 30, 40)
                break;
            case 145:
                ctx.drawImage(mouse, x, y, 30, 40)
                break;
            case 146:
                ctx.drawImage(chicken, x, y, 30, 40)
                break;
            case 147:
                ctx.drawImage(caterpillar, x, y, 30, 40)
                break;
        }
    }

}

function check_non_tai_scoring(data, tiles){
     
    // display board (unhide all board)
     board[orientation[data]] = tiles
     board['own'].discard_tile = null
     board['left'].discard_tile = null
     board['opposite'].discard_tile = null
     board['right'].discard_tile = null
     
 
     // calculate gangs for 4 player
     for (let i = 0; i < 4; i++){
         
         // Each player
         for (let j = 0; j < board[orientation[players_in_order[i]]].tiles_in_board.length - 3; j++){
             
             // Valid gang
             if (is_valid_gang(board[orientation[players_in_order[i]]].tiles_in_board.slice(j, j+ 4))){
                 
                 // an gang
                 if (board[orientation[players_in_order[i]]].tiles_in_board[j + 2] == board[orientation[players_in_order[i]]].tiles_in_board[j + 3]){
                     board[orientation[players_in_order[i]]].chips += 60
                     board[orientation[players_in_order[(i + 1) % 4]]].chips -= 20
                     board[orientation[players_in_order[(i + 2) % 4]]].chips -= 20
                     board[orientation[players_in_order[(i + 3) % 4]]].chips -= 20 
                 }
 
                 // ming gang
                 else{
                     board[orientation[players_in_order[i]]].chips += 30
                     board[orientation[players_in_order[(i + 1) % 4]]].chips -= 10
                     board[orientation[players_in_order[(i + 2) % 4]]].chips -= 10
                     board[orientation[players_in_order[(i + 3) % 4]]].chips -= 10
                 }
 
             }
         }
     }
 
     // hua
     for (let i = 0; i < 4; i++){
         
         // cat/mouse
         if (board[orientation[players_in_order[i]]].hua_array.includes(144) && board[orientation[players_in_order[i]]].hua_array.includes(145)){
             board[orientation[players_in_order[i]]].chips += 30
             board[orientation[players_in_order[(i + 1) % 4]]].chips -= 10
             board[orientation[players_in_order[(i + 2) % 4]]].chips -= 10
             board[orientation[players_in_order[(i + 3) % 4]]].chips -= 10
         }
 
         // chicken/caterpillar
         if (board[orientation[players_in_order[i]]].hua_array.includes(146) && board[orientation[players_in_order[i]]].hua_array.includes(147)){
             board[orientation[players_in_order[i]]].chips += 30
             board[orientation[players_in_order[(i + 1) % 4]]].chips -= 10
             board[orientation[players_in_order[(i + 2) % 4]]].chips -= 10
             board[orientation[players_in_order[(i + 3) % 4]]].chips -= 10
         }
 
         // an_yao (change 144 into another number at load(4))
 
         // 4 wind red
         if (board[orientation[players_in_order[i]]].hua_array.includes(136) && board[orientation[players_in_order[i]]].hua_array.includes(138) && board[orientation[players_in_order[i]]].hua_array.includes(140) && board[orientation[players_in_order[i]]].hua_array.includes(142)){
             board[orientation[players_in_order[i]]].chips += 30
             board[orientation[players_in_order[(i + 1) % 4]]].chips -= 10
             board[orientation[players_in_order[(i + 2) % 4]]].chips -= 10
             board[orientation[players_in_order[(i + 3) % 4]]].chips -= 10
         }
 
         // 4 wind blue
         if (board[orientation[players_in_order[i]]].hua_array.includes(137) && board[orientation[players_in_order[i]]].hua_array.includes(139) && board[orientation[players_in_order[i]]].hua_array.includes(141) && board[orientation[players_in_order[i]]].hua_array.includes(143)){
             board[orientation[players_in_order[i]]].chips += 30
             board[orientation[players_in_order[(i + 1) % 4]]].chips -= 10
             board[orientation[players_in_order[(i + 2) % 4]]].chips -= 10
             board[orientation[players_in_order[(i + 3) % 4]]].chips -= 10
         }
 
         // an yao(change 136 into another number at load(4))
 
     }
 
     // own wind
     if (board['own'].hua_array.includes(own_index * 2 + 136) && board['own'].hua_array.includes(own_index * 2 + 137)){
         board['own'].chips += 30
         board['left'].chips -= 10
         board['opposite'].chips -= 10
         board['right'].chips -= 10
     }
 
     if (board['right'].hua_array.includes(((own_index + 1) % 4) * 2 + 136) && board['right'].hua_array.includes(((own_index + 1) % 4) * 2 + 137)){
         board['right'].chips += 30
         board['left'].chips -= 10
         board['opposite'].chips -= 10
         board['own'].chips -= 10
     }
 
     if (board['opposite'].hua_array.includes(((own_index + 2) % 4) * 2 + 136) && board['opposite'].hua_array.includes(((own_index + 2) % 4) * 2 + 137)){
         board['opposite'].chips += 30
         board['left'].chips -= 10
         board['right'].chips -= 10
         board['own'].chips -= 10
     }
 
     if (board['left'].hua_array.includes(((own_index + 3) % 4) * 2 + 136) && board['left'].hua_array.includes(((own_index + 3) % 4) * 2 + 137)){
         board['left'].chips += 30
         board['opposite'].chips -= 10
         board['right'].chips -= 10
         board['own'].chips -= 10
     }
     
     // People have my wind(own)
     if (board['right'].hua_array.includes(own_index * 2 + 136) && board['right'].hua_array.includes(own_index * 2 + 137)){
         board['right'].chips += 10
         board['own'].chips -= 10
     }
 
     if (board['opposite'].hua_array.includes(own_index * 2 + 136) && board['opposite'].hua_array.includes(own_index * 2 + 137)){
         board['opposite'].chips += 10
         board['own'].chips -= 10
     }
 
     if (board['left'].hua_array.includes(own_index * 2 + 136) && board['left'].hua_array.includes(own_index * 2 + 137)){
         board['left'].chips += 10
         board['own'].chips -= 10
     }
 
     // People have the right wind
     if (board['own'].hua_array.includes(((own_index + 1) % 4)* 2 + 136) && board['own'].hua_array.includes(((own_index + 1) % 4)* 2 + 137)){
         board['own'].chips += 10
         board['right'].chips -= 10
     }
 
     if (board['opposite'].hua_array.includes(((own_index + 1) % 4)* 2 + 136) && board['opposite'].hua_array.includes(((own_index + 1) % 4)* 2 + 137)){
         board['opposite'].chips += 10
         board['right'].chips -= 10
     }
 
     if (board['left'].hua_array.includes(((own_index + 1) % 4)* 2 + 136) && board['left'].hua_array.includes(((own_index + 1) % 4)* 2 + 137)){
         board['left'].chips += 10
         board['right'].chips -= 10
     }
 
     // People have the opposite wind
     if (board['own'].hua_array.includes(((own_index + 2) % 4)* 2 + 136) && board['own'].hua_array.includes(((own_index + 2) % 4)* 2 + 137)){
         board['own'].chips += 10
         board['opposite'].chips -= 10
     }
 
     if (board['right'].hua_array.includes(((own_index + 2) % 4)* 2 + 136) && board['right'].hua_array.includes(((own_index + 2) % 4)* 2 + 137)){
         board['right'].chips += 10
         board['opposite'].chips -= 10
     }
 
     if (board['left'].hua_array.includes(((own_index + 2) % 4)* 2 + 136) && board['left'].hua_array.includes(((own_index + 2) % 4)* 2 + 137)){
         board['left'].chips += 10
         board['opposite'].chips -= 10
     }
 
     // People have the left wind
     if (board['own'].hua_array.includes(((own_index + 3) % 4)* 2 + 136) && board['own'].hua_array.includes(((own_index + 3) % 4)* 2 + 137)){
         board['own'].chips += 10
         board['left'].chips -= 10
     }
 
     if (board['right'].hua_array.includes(((own_index + 3) % 4)* 2 + 136) && board['right'].hua_array.includes(((own_index + 3) % 4)* 2 + 137)){
         board['right'].chips += 10
         board['left'].chips -= 10
     }
 
     if (board['opposite'].hua_array.includes(((own_index + 3) % 4)* 2 + 136) && board['opposite'].hua_array.includes(((own_index + 3) % 4)* 2 + 137)){
         board['opposite'].chips += 10
         board['left'].chips -= 10
     }
}

function display_peng(li) {
    ctx.drawImage(peng_notif, 500, 450, 150, 75)
    ctx.strokeText("(P)", 590, 470)
    num_to_pic_smaller(li[0], 530, 479)
    num_to_pic_smaller(li[1], 560, 479)
    num_to_pic_smaller(li[2], 590, 479)
}
function display_chi(li_1, li_2, li_3) {
    if (li_1 != false && li_2 == false && li_3 == false) {
        ctx.drawImage(chi_notif, 500, 450, 150, 75)
        ctx.strokeText("(Z)", 590, 470)
        num_to_pic_smaller(li_1[0], 530, 479)
        num_to_pic_smaller(li_1[1], 560, 479)
        num_to_pic_smaller(li_1[2], 590, 479)
    }
    else if (li_1 == false && li_2 != false && li_3 == false) {
        ctx.drawImage(chi_notif, 500, 450, 150, 75)
        ctx.strokeText("(X)", 590, 470)
        num_to_pic_smaller(li_2[0], 530, 479)
        num_to_pic_smaller(li_2[1], 560, 479)
        num_to_pic_smaller(li_2[2], 590, 479)
    }
    else if (li_1 == false && li_2 == false && li_3 != false) {
        ctx.drawImage(chi_notif, 500, 450, 150, 75)
        ctx.strokeText("(C)", 590, 470)
        num_to_pic_smaller(li_3[0], 530, 479)
        num_to_pic_smaller(li_3[1], 560, 479)
        num_to_pic_smaller(li_3[2], 590, 479)
    }
    else if (li_1 != false && li_2 != false && li_3 == false) {
        ctx.drawImage(chi_notif, 500, 450, 150, 75)
        ctx.strokeText("(Z)", 590, 470)
        num_to_pic_smaller(li_1[0], 530, 479)
        num_to_pic_smaller(li_1[1], 560, 479)
        num_to_pic_smaller(li_1[2], 590, 479)

        ctx.drawImage(chi_notif, 500, 370, 150, 75)
        ctx.strokeText("(X)", 590, 390)
        num_to_pic_smaller(li_2[0], 530, 399)
        num_to_pic_smaller(li_2[1], 560, 399)
        num_to_pic_smaller(li_2[2], 590, 399)
    }
    else if (li_1 != false && li_2 == false && li_3 != false) {
        ctx.drawImage(chi_notif, 500, 450, 150, 75)
        ctx.strokeText("(Z)", 590, 470)
        num_to_pic_smaller(li_1[0], 530, 479)
        num_to_pic_smaller(li_1[1], 560, 479)
        num_to_pic_smaller(li_1[2], 590, 479)

        ctx.drawImage(chi_notif, 500, 370, 150, 75)
        ctx.strokeText("(C)", 590, 390)
        num_to_pic_smaller(li_3[0], 530, 399)
        num_to_pic_smaller(li_3[1], 560, 399)
        num_to_pic_smaller(li_3[2], 590, 399)
    }
    else if (li_1 == false && li_2 != false && li_3 != false) {
        ctx.drawImage(chi_notif, 500, 450, 150, 75)
        ctx.strokeText("(X)", 590, 470)
        num_to_pic_smaller(li_2[0], 530, 479)
        num_to_pic_smaller(li_2[1], 560, 479)
        num_to_pic_smaller(li_2[2], 590, 479)

        ctx.drawImage(chi_notif, 500, 370, 150, 75)
        ctx.strokeText("(C)", 590, 390)
        num_to_pic_smaller(li_3[0], 530, 399)
        num_to_pic_smaller(li_3[1], 560, 399)
        num_to_pic_smaller(li_3[2], 590, 399)
    }
    else if (li_1 != false && li_2 != false && li_3 != false) {
        ctx.drawImage(chi_notif, 500, 450, 150, 75)
        ctx.strokeText("(Z)", 590, 470)
        num_to_pic_smaller(li_1[0], 530, 479)
        num_to_pic_smaller(li_1[1], 560, 479)
        num_to_pic_smaller(li_1[2], 590, 479)

        ctx.drawImage(chi_notif, 500, 370, 150, 75)
        ctx.strokeText("(X)", 590, 390)
        num_to_pic_smaller(li_2[0], 530, 399)
        num_to_pic_smaller(li_2[1], 560, 399)
        num_to_pic_smaller(li_2[2], 590, 399)

        ctx.drawImage(chi_notif, 500, 290, 150, 75)
        ctx.strokeText("(C)", 590, 310)
        num_to_pic_smaller(li_3[0], 530, 319)
        num_to_pic_smaller(li_3[1], 560, 319)
        num_to_pic_smaller(li_3[2], 590, 319)
    }

}
function display_gang(li) {
    ctx.drawImage(gang_notif, 500, 370, 150, 75)
    num_to_pic_smaller(li[0], 515, 399)
    num_to_pic_smaller(li[1], 545, 399)
    num_to_pic_smaller(li[2], 575, 399)
    num_to_pic_smaller(li[3], 605, 399)
}
