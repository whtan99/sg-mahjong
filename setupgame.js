function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

module.exports = {



setupgame: function(players){



  var all_tiles = Array.from(Array(147).keys())
  let wind_buffer = [0, 1, 2, 3]  
  for (var id in players) {
        player = players[id]

        player.tiles_in_hand = []
        player.tiles_in_board = []
        player.hua_array = []
        player.wind_pos = -1
        player.ordered_players = []
        player.all_tiles = []
        player.chip_count = 1000
        

        var x = getRandomInt(0, 4)
        while (wind_buffer[x] == 200){
          var x = getRandomInt(0, 4)
        }
        player.wind_pos = x
        
        wind_buffer[x] = 200
        

        

          while (player.tiles_in_hand.length < 13) {
              var x = getRandomInt(0, 148);
              if (all_tiles[x] != 200) {
                  player.tiles_in_hand.push(x);
                  all_tiles[x] = 200;
              }
          }
        
          for (var i = 0; i < 13; i++){ //loop thru hand
            while (player.tiles_in_hand[i] >= 136){ //if tile is hua (will continue to chongbu)
                player.hua_array.push(player.tiles_in_hand[i]);//push hua onto board
                var x = getRandomInt(0, 148); //get random int
                while (all_tiles[x] == 200){ //get valid tile (which is not already taken to replace hua)
                  var x = getRandomInt(0, 148);
                }
                player.tiles_in_hand[i] = x; //update hua tile to this tile
                all_tiles[x] = 200; //change tile in alltiles to be taken
            }
          }
        var i = player.tiles_in_hand.sort(function(a, b){return a-b})
        var j = player.hua_array.sort(function(a, b){return a-b})
        

        } 

        let counter = 0
        player_id = []
        while (player_id.length != 4){
            for (var id in players){
              if (players[id].wind_pos == counter){
                player_id.push(players[id].id)
                counter += 1
              }
            }
          }
        for (var id in players) {
          player = players[id]
          player.ordered_players = player_id 
          player.all_tiles = all_tiles
        }
    },

newround: function(players_array){
  var new_tiles = {}
  
  function fill_tiles(hand, hua, all_tiles){
    while (hand.length < 13) {
      var x = getRandomInt(0, 148);
      if (all_tiles[x] != 200) {
          hand.push(x);
          all_tiles[x] = 200;
      }
  }
   
   for (var i = 0; i < 13; i++){ //loop thru hand
    while (hand[i] >= 136){ //if tile is hua (will continue to chongbu)
        hua.push(hand[i]);//push hua onto board
        var x = getRandomInt(0, 148); //get random int
        while (all_tiles[x] == 200){ //get valid tile (which is not already taken to replace hua)
          var x = getRandomInt(0, 148);
        }
        hand[i] = x; //update hua tile to this tile
        all_tiles[x] = 200; //change tile in alltiles to be taken
    }
  }

  hand.sort(function(a, b){return a-b})
  hua.sort(function(a, b){return a-b})
}
  
  var all_tiles = Array.from(Array(147).keys())
  new_tiles[players_array[0]] = {tiles_in_hand: [],
                                 hua_array:[],
                                socketid:players_array[0],
                                all_tiles: []}
  
  fill_tiles(new_tiles[players_array[0]].tiles_in_hand, new_tiles[players_array[0]].hua_array, all_tiles)
  
  new_tiles[players_array[1]] = {tiles_in_hand: [],
                                 hua_array: [],
                                 socketid:players_array[1],
                                all_tiles: []}

  fill_tiles(new_tiles[players_array[1]].tiles_in_hand, new_tiles[players_array[1]].hua_array, all_tiles)

  new_tiles[players_array[2]] = {tiles_in_hand: [],
                                 hua_array: [],
                                 socketid:players_array[2],
                                all_tiles: []}

  fill_tiles(new_tiles[players_array[2]].tiles_in_hand, new_tiles[players_array[2]].hua_array, all_tiles)

  new_tiles[players_array[3]] = {tiles_in_hand: [],
                                 hua_array: [],
                                 socketid:players_array[3],
                                all_tiles: []}

  fill_tiles(new_tiles[players_array[3]].tiles_in_hand, new_tiles[players_array[3]].hua_array, all_tiles)
  
  for (var id in new_tiles) {
    player = new_tiles[id]
    player.all_tiles = all_tiles
  }
  
  return new_tiles
}

}
