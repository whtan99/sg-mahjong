var _ = require('lodash');



// magic to change individual tile number eg (2, 3) to tile (1dian)
function magic(num) {
    return Math.floor(num / 4)
}

// Checks whether list of 3 items is Pong
function is_valid_pong(li) {
    const one = magic(li[0])
    const two = magic(li[1])
    const three = magic(li[2])

    //if it is hua
    if (one >= 34 || two >= 34 || three >= 34) {
        return false
    }
    return one == two && two == three
}

// Checks whether list of 3 items is Chi
function is_valid_chi(li) {

    const one = magic(li[0])

    // if first value of list is 8 or 9, will go into next set, checks for da pai as well
    if (one == 7 || one == 8 || one == 16 || one == 17 || one >= 25) {
        return false
    }

    const two = magic(li[1])
    const three = magic(li[2])

    // if tile is hua or da pai

    return one + 1 == two && two + 1 == three
}



// What defines a set
function is_valid_set(li) {
    return is_valid_chi(li) || is_valid_pong(li)
}

// Tries to form a chi with the first tile
function check_special_chi(li){
    
    tiles_to_add = []
    
    const first_chr = magic(li[0])
    
    // Same conditions as chi
    if (first_chr == 7 || first_chr == 8 || first_chr == 16 || first_chr == 17 || first_chr >=25) {
        return false
    }
    
    var i = 0
    while (magic(li[i]) == magic(li[i + 1])) {
        i = i + 1
        if (i == li.length - 2)
            return false
    }
    var j = i + 1

    // if next character is not in order, then fail
    if (magic(li[j]) != first_chr + 1 ){
        return false
    }

    while (magic(li[j]) == magic(li[j + 1])) {
        j = j + 1
        if (j == li.length - 1)
            return false
    }   

    if (magic(li[j+1]) != first_chr + 2){
        return false
    }

    // if its true, remove from list
    tiles_to_add.push(li[0], li[i + 1], li[j + 1]) 
    li.splice(0, 1)
    li.splice(i, 1)
    li.splice(j - 1, 1)

    return true && tiles_to_add
}

function check_hua(hua_array, player_wind){
    var counter = 0
    var text = ' '
    if (hua_array.includes(144) && hua_array.includes(145) && hua_array.includes(146) && hua_array.includes(147)){
        return '5 animal animal animal animal'
    }
    
    else{ 
        for (let i = 0; i < hua_array.length; i++){
            if (hua_array[i] >= 144 && hua_array[i] <= 147){
                counter ++
                text += ' animal '
            }

            if (hua_array[i] == player_wind * 2 + 136  || hua_array[i] == player_wind * 2 + 137){ 
                counter ++
                text += ' player_own_hua '
            }
        }
    }
    return counter.toString() + text.slice(0, -1)
}

function check_dragon_wind(li, player_wind, prevailing_wind){
    var counter = 0
    var text = ' '
    for (let i = 0; i < li.length - 1; i++){
        var check = magic(li[i][0])
        if (check == 27){
            counter ++
            text += ' red_dragon '
        }
        if (check == 28){
            counter ++
            text += ' white_dragon '
        }

        if (check == 29){
            counter ++
            text += ' green_dragon '
        }
        
        if (check == player_wind + 30){
            counter++
            text += ' player_wind '
        }
        if (check == prevailing_wind + 30){
            counter ++ 
            text += ' prevailing_wind '
        }
    }
    return counter.toString() + text.slice(0, -1)
}

// Check13yao

function thirteen_wonder(li){
    var fourteen_tiles = []
    
    for (var i = 0; i < li.length; i++){
        fourteen_tiles.push(magic(li[i]))
    }
    
    // new set with 1 of evertything
    let unique = new Set(fourteen_tiles);
    
    // check for all tiles
    return unique.has(0) 
    && unique.has(8) 
    && unique.has(9) 
    && unique.has(17) 
    && unique.has(18) 
    && unique.has(26)
    && unique.has(27)
    && unique.has(28) 
    && unique.has(29)
    && unique.has(30)
    && unique.has(31)
    && unique.has(32)
    && unique.has(33)
    

}



module.exports = {

check_win: function(original) {
    
    const li = _.cloneDeep(original)
    li.sort(function(a, b){return a-b})
    
    // Add 13yao
    if (thirteen_wonder(li)) {
        return true
    }
    
    // Add 8 flower suit game
    // Add all da pai game
    // Add all all feng game
    eyes_checked = []
    
    // Base case: 4 * is valid set + 1* is_valid eye
    for (var i = 0; i < li.length - 1; i++) {

        tiles_for_payment = []
        tiles_eyes = []
        
        // take out eyes 
        if (magic(li[i]) == magic(li[i + 1]) && !(eyes_checked.includes(magic(li[i])))) {

            const hand_wo_eyes = _.cloneDeep(li)
            eyes_checked.push(magic(li[i]))
            tiles_eyes.push(li[i], li[i + 1])
            hand_wo_eyes.splice(i, 2)
            
            //initial list is unaffected

            
            
            const sets_to_find = hand_wo_eyes.length / 3
            
            // sets actually found in this round
            var counter = 0
            
            // loop through maximum sets to find
            for (var j = 0; j < sets_to_find; j++){
                
                var got_set = false
                
                // check the first tile for valid set through normal chi or pong
                if (is_valid_set(hand_wo_eyes.slice(0, 3))) {
                    counter ++
                    tiles_for_payment.push(hand_wo_eyes.slice(0, 3))
                    hand_wo_eyes.splice(0, 3)
                    got_set = true
                
                }
                
                // try to form special chi from first tile
                if (check_special_chi(hand_wo_eyes)){
                    counter ++
                    tiles_for_payment.push(tiles_to_add)    
                    got_set = true
                    
                }

                // condition to break loop early in case both fails
                if (got_set == false){  
                    break
                }
            }

        
            if (counter == sets_to_find){
                // push tiles_in_board to tiles for payment
                tiles_for_payment.push(tiles_eyes)
                return true && tiles_for_payment
            }

    }
}
    // going through all possible eyes - win must be false
    return false
},

// Tiles in board have to be added somehow + zi mo for ping hu(no need wait 2 sides)
calculate_tai: function(li, last, player_wind , prevailing_wind , hua_array, self){
    
    var counter = 0
    var text = ' '
    var temp
    var temp_2
    // Check hua/dragon/feng
    temp = check_hua(hua_array, player_wind)
    counter = parseInt(temp.slice(0, 1))
    text = ' ' + temp.slice(1) + ' '
    
    temp_2 = check_dragon_wind(li, player_wind, prevailing_wind)
    counter += parseInt(temp_2.slice(0, 1))
    text += ' ' + temp_2.slice(1) + ' '

    if (counter >= 5){
        return counter.toString() + text 
    }

    if (chou_ping_hu(li, last, player_wind, prevailing_wind, self)){
        counter += 1
        text += ' chou_ping_hu '
        if (ping_hu(hua_array)){
            counter += 3
            text += ' ping_hu '
        }
    }
    
   
    else if (dui_dui(li)){
        counter += 2
        text += ' dui_dui '
        if (one_nine_half(li)){
            counter += 2
            text += ' one_nine_half '
            if (one_nine(li)){
                counter += 1
                text += ' one_nine '
            }
        }
    }

    

    if(ban_se(li)){
        counter += 2
        text += ' ban_se '
        if (yi_se(li)){
            counter += 2
            text += ' yi_se '
        }
    }

    if (thirteen_wonder(li)){
        counter += 5
        text += ' thirteen_wonder '
    }

    if (counter >= 5){
        return '5 ' + text
    }

    return counter.toString() + text
},

is_valid_gang: function(li) {
    const one = magic(li[0])
    const two = magic(li[1])
    const three = magic(li[2])
    const four = magic(li[3])

    return one == two && two == three && three == four
}

}
// ------------------------------------------------------------------------------------------------------------------------
// ====================================================== PAYMENT =========================================================
// ------------------------------------------------------------------------------------------------------------------------


// reference player_wind and prevailing wind
function chou_ping_hu(li, last, player_wind, prevailing_wind, self_drawn) {
    const times_to_run = li.length - 1 
    
    
    // checks player hand for valid chi
    for (var i = 0; i < times_to_run; i++){
        if (is_valid_chi(li[i]) == false){
            return false
        }
    }
    
    // checks valid players eye
    const eye_magic = magic(li[4][0])
    if (eye_magic == 27 || eye_magic == 28 || eye_magic == 29 || eye_magic == player_wind + 30 || eye_magic == prevailing_wind + 30){
        return false
    }
    
    if (self_drawn == true){
        return true
    }

    // checks last element added (for discard)
    else {

    for (var i = 0; i < times_to_run; i++){
        
        if (li[i].includes(last)){
            
            var list_concerned = li[i].filter(number => number != last)

            // 3dian would be bigger than both 1dian2dian but not valid 2 sides
            if (last > list_concerned[0] && last > list_concerned[1]){
                var temp = magic(last)
                if (temp != 2 && temp != 11 && temp != 20){
                    return true
                }
            }
            
            // 7 dian would be smaller than both 8dian9dian but not valid 2 sides
            else if (last < list_concerned[0] && last < list_concerned[1]){
                var temp = magic(last)
                if (temp != 6 && temp != 15 && temp != 24){
                    return true
                }
            }
        }
    }

    // 3dian would be bigger than both 1dian2dian but not valid 2 sides
    
}
    return false
}


// Checks for Ping hu (have to implement HUA array)
function ping_hu(hua_array){
    return hua_array.length == 0
}

// Checks for DuiDui
function dui_dui(li){
    const times_to_run = li.length - 1
    
    // checks player hand for pong
    for (var i = 0; i < times_to_run; i++){
        if (is_valid_pong(li[i]) == false){
            return false
        }
    }

    return true
}

// Checks for Ban Se 
function ban_se(li){
    
    
    first_tile = magic(li[0][0])
    var i = 1
    
    // First tile drawn may be Da Pai
    while (first_tile > 26){
        first_tile = magic(li[i][0])
        i ++ 
        
        // Whole array is Da Pai
        if (i == 5){
            return false
        }
    }
    
    
    // Checks First Element of Every Hand
    for (var i = 0; i < 5; i++){
        
        // Tong 
        if (first_tile >= 0 && first_tile <= 8){
            if (magic(li[i][0]) > 8 && magic(li[i][0]) <= 26){
                return false
            }
        }

        // Bamboo
        else if (first_tile >= 9 && first_tile <= 17){
            if (magic(li[i][0]) < 8 || (magic(li[i][0]) > 17 && magic(li[i][0]) <= 26)){
                return false
            }
        }
        
        // Wan Zi
        else if (first_tile >= 18 && first_tile <= 26){
            if (magic(li[i][0]) < 18){
                return false
            }
        }
    }

    return true
}


function yi_se(li){
   
    for (let i = 0; i < 5; i++){
        if (magic(li[i][0]) > 26){
            return false
        }
    }

    return true
}

function one_nine_half(li){

    for (let i = 0; i < 4; i++){
        var x = magic(li[i][0])
        if (x != 0 && x != 8 && x != 9 && x != 17 && x != 18 && x <= 26){
            return false
        }
}

    return true
}


function one_nine(li){
    
    for (let i = 0; i < 4; i++){
        var x = magic(li[i][0])
        if (x != 0 && x != 8 && x != 9 && x != 17 && x != 18 && x != 26){
            return false
        }
}

    return true
}

// test
console.log(module.exports.calculate_tai([[0, 1, 2],[8, 12,16],[32, 33, 34],[72, 76, 80],[14, 15]], 2, 2, 2, [], false))

