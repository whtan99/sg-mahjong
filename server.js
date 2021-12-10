var express = require('express');
var app = express()
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 5000;
var setupgame = require('./setupgame.js');
var scoring = require('./scoring.js')

app.use('/static', express.static(__dirname + '/static'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/how-to-play', function (req, res) {
    res.sendFile(__dirname + '/how-to-play.html');
});

app.get('/terms', function (req, res) {
    res.sendFile(__dirname + '/terms.html');
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});


var all_rooms = {
    '1': {},
    '2': {},
    '3': {},
    '4': {},
    '5': {},
    '6': {},
    '7': {},
    '8': {},
    '9': {},
    '10': {},
    '11': {},
    '12': {},
    '13': {},
    '14': {},
    '15': {},
    '16': {},
    '17': {},
    '18': {},
    '19': {},
    '20': {},
    '21': {},
    '22': {},
    '23': {},
    '24': {},
    '25': {}
};
var players_name_dict = {
    '1': [],
    '2': [],
    '3': [],
    '4': [],
    '5': [],
    '6': [],
    '7': [],
    '8': [],
    '9': [],
    '10': [],
    '11': [],
    '12': [],
    '13': [],
    '14': [],
    '15': [],
    '16': [],
    '17': [],
    '18': [],
    '19': [],
    '20': [],
    '21': [],
    '22': [],
    '23': [],
    '24': [],
    '25': []
}

var shooter_option = { 
    '1': false,
    '2': false,
    '3': false,
    '4': false,
    '5': false,
    '6': false,
    '7': false,
    '8': false,
    '9': false,
    '10': false,
    '11': false,
    '12': false,
    '13': false,
    '14': false,
    '15': false,
    '16': false,
    '17': false,
    '18': false,
    '19': false,
    '20': false,
    '21': false,
    '22': false,
    '23': false,
    '24': false,
    '25': false
}



io.on('connection', function (socket) {
  
  socket.join('waiting_room')
  
  socket.emit('table_firstload', players_name_dict, shooter_option)

    // When user clicks button on html
    socket.on("join_room", function (room_number, player_name, checked) {

        //if first person to join the room, lock checkbox for shooter option
        if (players_name_dict[room_number].length == 0) {
            io.to('waiting_room').emit('lock_checkbox', checked, room_number)
            shooter_option[room_number] = checked
        }

        socket.leave('waiting_room')

        socket.join(room_number)

        if (player_name != "DEV TEAM") {
            players_name_dict[room_number].push(player_name)

            //put player in waiting room, also emits to all players in that room
            io.to(room_number).emit('in_room', players_name_dict[room_number], room_number, all_rooms[room_number])

            //update table to reflect player joining a room
            io.to('waiting_room').emit('update_table', room_number, players_name_dict[room_number])

            all_rooms[room_number][socket.id] = {
                id: socket.id,
                username: player_name
            };
        }
        //for dev. still required in order to load up chatbox
        else {
            io.to(room_number).emit('in_room', players_name_dict[room_number], room_number, all_rooms[room_number])
        }
    })

    socket.on('dev_login', function(password){
      if (password == "*D-v8nDHLqU(eru") {
        socket.emit('password_correct')
      }
    })

    // chat function
    socket.on('chat', function (chat_msg, room_num, name) {
        io.to(room_num).emit('chat_to_client', chat_msg, name)
    })

    socket.on('dev_broadcast', function (msg) {
        io.sockets.emit('dev_broadcast_to_client', msg)
    })
    // start game when room has emitted that it has 4 players
    socket.on('load_game', function(room_num) {
        
        setupgame.setupgame(all_rooms[room_num])
        
        
        // load inital game
        io.to(room_num).emit('load_4', all_rooms[room_num]);
        
        // set_player_turn
        io.to(room_num).emit('set_player_turn', all_rooms[room_num][Object.keys(all_rooms[room_num])[0]].ordered_players[0])
      
        io.to(room_num).emit('draw_tile')
        
        
    })
  
    // client request new round from server
    socket.on('new_round_to_server', function(players_in_order, banker, room_num){
       var new_tiles = setupgame.newround(players_in_order)
       
        io.to(room_num).emit('new_round_to_client', new_tiles)

        io.to(room_num).emit('set_player_turn', banker)

        io.to(room_num).emit('draw_tile')
    })

      // checks win condition for zi_mo
      socket.on("check_win", function (player_tile, own_index, prevailing_wind, socketid, all, room_num) {
        
        // checks whether winning is even possible
        var to_check = scoring.check_win(player_tile.tiles_in_hand)

        // winning is possible, now must calculate tai
          if (to_check != false) {

              var eyes = to_check.pop()

              var to_add_arr = []

              // checks for gang which screws up calculation of tai
              for (let i = 0; i < player_tile.tiles_in_board.length; i += 3) {

                  if (scoring.is_valid_gang(player_tile.tiles_in_board.slice(i, i + 4))) {

                      let to_add = player_tile.tiles_in_board.splice(i + 3, 1)

                      to_add_arr.push(to_add[0], i + 3)
                  }

                  to_check.push(player_tile.tiles_in_board.slice(i, i + 3))

              }

              // calculate_tai uses the eyes at the back
              to_check.push(eyes)

              var tai_won = scoring.calculate_tai(to_check, null, own_index, prevailing_wind, player_tile.hua_array, true)



              // Valid hand + At least 1 tai
              if (parseInt(tai_won.slice(0, 1)) > 0) {

                  for (let i = 0; i < to_add_arr.length; i = i + 2) {
                      player_tile.tiles_in_board[to_add_arr[i + 1]] = to_add_arr[i]
                  }

                  io.to(room_num).emit('option_to_win', socketid, tai_won, player_tile, socketid, all)
                  return
              }
          }
        
          io.to(room_num).emit('discard')
        
      })

      // does not want to win
      socket.on('continue_round', function(room_num){
          io.to(room_num).emit('discard')
      })

      socket.on('continue_round_from_other', function(tiles, socketid, all, room_num){
          io.to(room_num).emit('discard_to_client', tiles, socketid, all)
      })

      // Must first check whether it's a valid win for anyone
      socket.on('discard_to_server', function(tiles, socketid, right, opposite, left, all, own_index, prevailing_wind, rightid, oppid, leftid, room_num){
        var to_add = tiles.discard_tile[0]
        
        right.tiles_in_hand.push(to_add)
        to_check_right = scoring.check_win(right.tiles_in_hand)
        
        // right_player has a valid hand
        if (to_check_right != false){
          
          var eyes = to_check_right.pop()
          
          for (let i = 0; i < right.tiles_in_board.length ; i += 3){
            if (scoring.is_valid_gang(right.tiles_in_board.slice(i, i + 4))){
              right.tiles_in_board.splice(i, 1)
              }
            
            to_check_right.push(right.tiles_in_board.slice(i, i + 3))
          }

          to_check_right.push(eyes)
          
          var tai_won_right = scoring.calculate_tai(to_check_right, to_add, ((own_index+ 1) %4), prevailing_wind, right.hua_array, false)
          

          // right hand valid + 
          if (parseInt(tai_won_right.slice(0, 1)) > 0){
            io.to(room_num).emit('option_to_win', rightid, tai_won_right, tiles, socketid, all)
            return
          }
        }

        opposite.tiles_in_hand.push(to_add)
        to_check_opp = scoring.check_win(opposite.tiles_in_hand)
        
        if (to_check_opp != false){
          var eyes = to_check_opp.pop()
          
          for (let i = 0; i < opposite.tiles_in_board.length ;i += 3){
            if (scoring.is_valid_gang(opposite.tiles_in_board.slice(i, i + 4))){
              opposite.tiles_in_board.splice(i, 1)
              }
            
            to_check_opp.push(opposite.tiles_in_board.slice(i, i + 3))
          
          }

          to_check_opp.push(eyes)
          
          var tai_won_opp = scoring.calculate_tai(to_check_opp, to_add, ((own_index+ 2) % 4 ), prevailing_wind, opposite.hua_array, false)
          

          if (parseInt(tai_won_opp.slice(0, 1)) > 0){
            io.to(room_num).emit('option_to_win', oppid, tai_won_opp, tiles, socketid, all)
          return
          }
        }

        left.tiles_in_hand.push(to_add)
        to_check_left = scoring.check_win(left.tiles_in_hand)
        
        if (to_check_left != false){
          var eyes = to_check_left.pop()
          
          for (let i = 0; i < left.tiles_in_board.length ; i += 3){
            if (scoring.is_valid_gang(left.tiles_in_board.slice(i, i + 4))){
              left.tiles_in_board.splice(i, 1)
              }

            
            to_check_left.push(left.tiles_in_board.slice(i, i + 3))
            
          
          }

          to_check_left.push(eyes)
          
          var tai_won_left = scoring.calculate_tai(to_check_left, to_add, ((own_index+ 3) %4), prevailing_wind, left.hua_array, true)
          

          if (parseInt(tai_won_left.slice(0, 1)) > 0){
            
            io.to(room_num).emit('option_to_win', leftid, tai_won_left, tiles, socketid, all)
          return
          }
        }
          
          io.to(room_num).emit('discard_to_client', tiles, socketid, all)
      })

      socket.on('no_peng', function (socketid, room_num){
        io.to(room_num).emit('ok_to_chi', socketid)
      })

      socket.on('peng_to_server', function(tiles, socketid, room_num){
          io.to(room_num).emit('peng_to_clients', tiles, socketid)
    })

      socket.on('request_special_change', function(data, room_num){
          io.to(room_num).emit('set_player_turn', data)
          io.to(room_num).emit('discard')
      })

      socket.on('request_draw_tile', function(room_num){  
        io.to(room_num).emit('draw_tile')
      })

      socket.on('chi_to_server', function(tiles, socketid, room_num){
          io.to(room_num).emit('chi_to_clients', tiles, socketid)
    })

      socket.on('gang_to_server', function(player_tile, own_index, prevailing_wind, socketid, all, room_num, type){
        
        // check_win_first
        var to_check = scoring.check_win(player_tile.tiles_in_hand)
        if (to_check != false){
          // li, last, player_wind, prevailing_wind, hua_array, self
          var eyes = to_check.pop()
          var to_add_arr = []
          for (let i = 0; i < player_tile.tiles_in_board.length ; i += 3){
            if (scoring.is_valid_gang(player_tile.tiles_in_board.slice(i, i + 4))){
            let to_add = player_tile.tiles_in_board.splice(i + 3, 1)
            to_add_arr.push(to_add[0], i + 3)
            }
            to_check.push(player_tile.tiles_in_board.slice(i, i + 3))
          }
          to_check.push(eyes)
          var tai_won = scoring.calculate_tai(to_check, null, own_index , prevailing_wind, player_tile.hua_array, true)
        }

        if (tai_won > 0) {
          
          for (let i = 0; i < to_add_arr.length; i = i + 2){
          player_tile.tiles_in_board[to_add_arr[i + 1]] = to_add_arr[i]
          }
            io.to(room_num).emit('set_player_turn', socketid)
            io.to(room_num).emit('option_to_win', socketid, (tai_won + 1) % 5, player_tile, socketid, all)
          return
        }
        
        else if (type == 'normal'){
            io.to(room_num).emit('discard')
            return
        }
        else {
            io.to(room_num).emit('peng_to_clients', player_tile, socketid)
        }
      })
    

      socket.on('update_discard_pile', function(data, room_num){  
        io.to(room_num).emit('discard_board_to_client', data)
      })

      socket.on('round_won_to_server', function(data, tiles, room_num){
          io.to(room_num).emit('round_won_to_client', data, tiles)
      })

      // for less than 15 tiles
      socket.on('end_game_to_server', function(data, tiles, room_num){
        io.to(room_num).emit('end_game_to_client', data, tiles)
      })


    socket.on('disconnecting', function () {
        var current_room = Object.keys(socket.rooms);

        //to determine if player disconnecting is devteam
        var dev = true
        
        if (current_room[1] != 'waiting_room'){

            // players_names_dictionary
            var pos_finder = Object.keys(all_rooms[current_room[0]])

        
            for (let i = 0; i < pos_finder.length; i++){
              if (socket.id == pos_finder[i]){
                players_name_dict[current_room[0]].splice(i, 1)
                // all_rooms
                  delete all_rooms[current_room[0]][socket.id]
                  dev = false
                break;
              }
            }
            //if not a dev, go ahead and put everyone back in waiting stage
            if (dev == false) {
                // to 3 other gamesjs, put them back in waiting stage
                socket.to(current_room[0]).emit('in_room', players_name_dict[current_room[0]], current_room[0], all_rooms[current_room]);

                // to everyone in waiting room
                socket.to('waiting_room').emit('update_table', current_room[0], players_name_dict[current_room[0]])
            }      }

    });
})
