// Description:
//   Plays a game of Rock-Paper-Scissors-Lizard-Spock, as discussed by Sheldon
//   in The Big Bang Theory - S2E8 "The Lizard-Spock Expansion".
//
// Commands:
//   hubot sheldon rules - Lists rules for game
//   hubot sheldon score - Get current scores
//   hubot sheldon stats [username] - Get lifetime stats for user, defaults to your user.
//   hubot rock | paper | scissors | lizard | spock - Make your move
//   hubot bazinga - End game and display results
//
// Authors:
//   cchen

var _ = require('underscore');

module.exports = function(robot) {

  // Constant string to hold helper text for when a game is not in progress.
  var NO_GAME = 'No game in progress!\nEnter `akitabot rock | paper | scissors | lizard | spock` to start ' +
    'a game.';

  // Array of possible moves.
  var moves = [
    'rock',
    'paper',
    'scissors',
    'lizard',
    'spock'
  ];

  // Map of winning move to losing moves.
  var wins = {
    'rock'    : [ 'lizard', 'scissors' ],
    'paper'   : [ 'rock', 'spock' ],
    'scissors': [ 'paper', 'lizard' ],
    'lizard'  : [ 'spock', 'paper' ],
    'spock'   : [ 'scissors', 'rock' ]
  };

  // Map of move to emoji.
  var emoji = {
    'rock'     : ':fist:',
    'paper'    : ':hand:',
    'scissors' : ':v:',
    'lizard'   : ':ok_hand:',
    'spock'    : ':spock-hand:'
  };

  var username = null;
  var gameInfo = {};

  // All game information will be stored in sheldon.
  robot.brain.on('loaded', function() {

    // Set timeout since there is a lag between discovering redis and loading data.
    setTimeout(function() {
      if (robot.brain.get('sheldon')) {
        gameInfo = robot.brain.get('sheldon');
      }
    }, 200);
  });


  // Displays the rules of the game.
  robot.respond(/sheldon rules/i, function(msg) {
    msg.send('Scissors cuts paper,\npaper covers rock,\nrock crushes lizard,\nlizard poisons Spock,\n' +
      'Spock smashes scissors,\nscissors decapitates lizard,\nlizard eats paper,\npaper disproves ' +
      'Spock,\nSpock vaporizes rock,\nand as it always has, rock crushes scissors.');
    msg.send('http://i.imgur.com/Eqav7LO.png');
    msg.send('Type: `akitabot rock | paper | scissors | lizard | spock` to play.\nPlay as many rounds as you ' +
      'want, end the game by typing: `akitabot bazinga`.\n');
  });

  // Displays the current points.
  robot.respond(/sheldon score/i, function(msg) {
    var playerName = msg.message.user.name.toLowerCase();

    // Creates empty stats for player if player has not played before.
    checkPlayer(playerName);

    var playerPoints = gameInfo[playerName].currentGame.playerPoints;
    var hubotPoints = gameInfo[playerName].currentGame.hubotPoints;
    if (playerPoints === 0 && hubotPoints == 0) {
      msg.send(NO_GAME);
    } else {
      msg.send('You: ' + playerPoints + ', Computer: ' + hubotPoints);
    }
  });

  // Displays lifetime stats of a user.
  robot.respond(/sheldon stats (.*)|sheldon stats/i, function(msg) {
    var playerName = msg.match[1];
    console.log('player name: ' + playerName);
    if (!playerName) {
      playerName = msg.message.user.name;
    }

    playerName = playerName.toLowerCase();

    if (!gameInfo[playerName]) {
      msg.send('@' + playerName + ' has never played Rock-Paper-Scissors-Lizard-Spock!');
      return;
    }

    var stats = gameInfo[playerName].lifetimeStats;

    msg.send('Lifetime Stats for @' + playerName + '\n*Wins: ' + stats.wins + '*\n*Loses: ' + stats.loses +
      '*\n*Ties: ' + stats.ties + '*');

  });

  /* P L A Y E R  M O V E S */
  robot.respond(/rock/i, function(msg) {
    playRound('rock', msg);
  });

  robot.respond(/paper/i, function(msg) {
    playRound('paper', msg);
  });

  robot.respond(/scissors/i, function(msg) {
    playRound('scissors', msg);
  });

  robot.respond(/lizard/i, function(msg) {
    playRound('lizard', msg);
  });

  robot.respond(/spock/i, function(msg) {
    playRound('spock', msg);
  });

  // Ends the game and prints results.
  robot.respond(/bazinga/i, function(msg) {

    // Check whether most recent user is different from current user.
    if (username !== msg.message.user.name.toLowerCase()) {
      username = msg.message.user.name.toLowerCase();
    }

    checkPlayer(username);

    // Get current points.
    var playerPoints = gameInfo[username].currentGame.playerPoints;
    var hubotPoints = gameInfo[username].currentGame.hubotPoints;

    if (playerPoints === 0 && hubotPoints == 0) {
      msg.send(NO_GAME);
      return;
    }

    if (playerPoints > hubotPoints) {
      gameInfo[username].lifetimeStats.wins++;
      msg.send('http://31.media.tumblr.com/tumblr_md0f0fTLlw1r1mtsdo1_250.gif\nYou win!');
    } else if (playerPoints < hubotPoints) {
      gameInfo[username].lifetimeStats.loses++;
      msg.send('https://suggestsmagic.files.wordpress.com/2011/11/loser-sheldon.jpg\nYou lose!');
    } else {
      gameInfo[username].lifetimeStats.ties++;
      msg.send('https://66.media.tumblr.com/tumblr_m9jvh8wzus1remtwmo1_500.gif\nIt\'s a tie!');
    }
    msg.send('You: ' + playerPoints + ', Computer: ' + hubotPoints);

    // Reset points when game ends.
    gameInfo[username].currentGame.playerPoints = 0;
    gameInfo[username].currentGame.hubotPoints = 0;

    // Save game information.
    robot.brain.save(gameInfo);

    //robot.brain.save();
  });

  // Plays a move for the bot.
  var playRound = function(player, msg) {

    // Check if username is different than current user.
    if (!username || username !== msg.message.user.name.toLowerCase()) {
      username = msg.message.user.name.toLowerCase();
    }

    checkPlayer(username);

    var randomNum = _.random(0, moves.length-1);
    var botMove = moves[randomNum];

    var outcome = evaluateWin(player, botMove);
    msg.send('>`' + botMove + '`');
    switch (outcome) {
      case 0:
        msg.send(':necktie: Tie!');
        break;
      case 1:
        gameInfo[username].currentGame.playerPoints++;
        msg.send(emoji[player] + ' ' + player.toUpperCase() + ' wins!');
        break;
      case -1:
        gameInfo[username].currentGame.hubotPoints++;
        msg.send(emoji[botMove] + ' ' + botMove.toUpperCase() + ' wins!');
        break;
    }

    robot.brain.save(gameInfo);
  };

  // Evaluates which player wins.
  var evaluateWin = function(player, computer) {
    if (player === computer) {
      return 0;
    } else if (_.contains(wins[player], computer)) {
      return 1;
    } else {
      return -1;
    }
  };

  var checkPlayer = function(username) {

    // Check if user has played before. If not, create stats for user.
    if (!gameInfo[username]) {
      gameInfo[username] = {
        'currentGame'  : {
          'playerPoints' : 0,
          'hubotPoints'  : 0
        },
        'lifetimeStats': {
          'wins'  : 0,
          'loses' : 0,
          'ties'  : 0
        }
      };

      robot.brain.save(gameInfo);
    }
  }

};
