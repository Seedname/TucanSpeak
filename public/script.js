const lvl1 = {
  "Greetings and Introductions": {
    "Hello, how are you?": "Hola, ¿cómo estás?",
    "My name is [your name].": "Me llamo [tu nombre].",
    "Nice to meet you.": "Mucho gusto.",
    "Good morning.": "Buenos días.",
    "Good afternoon.": "Buenas tardes.",
    "Good evening/night.": "Buenas noches."
  },
  "Basic Questions": {
    "How are you?": "¿Qué tal?",
    "What is your name?": "¿Cómo te llamas?",
    "Where are you from?": "¿De dónde eres?",
    "How old are you?": "¿Cuántos años tienes?",
    "What time is it?": "¿Qué hora es?",
    "Can you help me?": "¿Puedes ayudarme?",
    "Where is the bathroom?": "¿Dónde está el baño?",
    "How much does this cost?": "¿Cuánto cuesta esto?",
    "Do you speak English?": "¿Hablas inglés?",
    "What is this?": "¿Qué es esto?",
    "Can you repeat that?": "¿Puedes repetir eso?"
  },
  "Common Phrases": {
    "Please.": "Por favor.",
    "Thank you.": "Gracias.",
    "You're welcome.": "De nada.",
    "Excuse me.": "Perdón.",
    "I'm sorry.": "Lo siento.",
    "Yes.": "Sí.",
    "No.": "No.",
    "I don't understand.": "No entiendo.",
    "I don't know.": "No sé.",
    "I like it.": "Me gusta.",
    "I love you.": "Te quiero.",
    "I am hungry.": "Tengo hambre.",
    "I am thirsty.": "Tengo sed.",
    "I am tired.": "Estoy cansado/cansada.",
    "I need help.": "Necesito ayuda."
  },
  "Directions and Places": {
    "Where is the hotel?": "¿Dónde está el hotel?",
    "Turn right.": "Gira a la derecha.",
    "Turn left.": "Gira a la izquierda.",
    "Go straight ahead.": "Sigue recto.",
    "Is it far?": "¿Está lejos?",
    "Is it near?": "¿Está cerca?",
    "I am lost.": "Estoy perdido/perdida."
  },
  "Shopping and Money": {
    "How much is it?": "¿Cuánto cuesta?",
    "I want to buy this.": "Quiero comprar esto.",
    "Do you accept credit cards?": "¿Aceptan tarjetas de crédito?",
    "I need a receipt.": "Necesito un recibo.",
    "Can you give me a discount?": "¿Me puede dar un descuento?",
    "Where is the market?": "¿Dónde está el mercado?",
    "What time does it open?": "¿A qué hora abre?",
    "What time does it close?": "¿A qué hora cierra?"
  },
  "Eating and Drinking": {
    "I would like a table for two.": "Quisiera una mesa para dos.",
    "Can I see the menu?": "¿Puedo ver el menú?",
    "What do you recommend?": "¿Qué me recomienda?",
    "I am a vegetarian.": "Soy vegetariano/vegetariana.",
    "The check, please.": "La cuenta, por favor.",
    "Water, please.": "Agua, por favor."
  }
}


var score = 0;
let currentSentence = { spanishSentence: "", englishTranslation: "" };
let isRunning = false; // Flag to check if the game is running
let gameOver = false; 

var correct = new Audio("./soundEffects/correct.mp3");
var incorrect = new Audio("./soundEffects/incorrect.mp3");




// Function to get a random sentence from the dictionary
function getRandomSentence() {
    const categories = Object.keys(lvl1);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const phrases = lvl1[randomCategory];
    const keys = Object.keys(phrases);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const spanishSentence = phrases[randomKey];
    const englishTranslation = randomKey;

    return { spanishSentence, englishTranslation };
}

$('.ai-button').click(function() { 
  $('.api-response').toggleClass('api-response-show');

  
});


// Click event for submit button
$('.button').click(function() {
    $('.scoreboard').removeClass("scoreboard-show"); 
    if (!isRunning) {
        $('.api-response').html("Please start the game first!");
        return;
    }
    
    var userInput = $('.input').val();
    const apiRequestMessage = `Is "${userInput}" the English translation of "${currentSentence.spanishSentence}"?`;

    // Display loading message
    $('.api-response').html("Loading AI response...🔃");

    $.ajax({
        url: '/message',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ message: apiRequestMessage }),
        success: function(data) {
            // Check if the response indicates the translation is correct
            if (data.response.toLowerCase().includes('correct')) {
                score += 1;
                correct.play();
                // Generate a new random sentence
                currentSentence = getRandomSentence();
                $('.output').html(currentSentence.spanishSentence);
                $('.input').val(""); // Clear the input field
            } else { 
                incorrect.play(); 
                $('.input').val(""); // Clear the input field
            }

            // Update the score and display the API response
            $('.score').html("SCORE: " + score);
            $('.api-response').html(data.response);
        },
        error: function(error) {
            console.error('Error:', error);
            $('.api-response').html("An error occurred. Please try again.");
        }
    });
});

// Click event for start button
$('.start-button').click(function() {
    if (isRunning) return; // Prevent further clicks if the game is running

    // Generate and display a new random sentence
    currentSentence = getRandomSentence();
    $('.output').html(currentSentence.spanishSentence);
    isRunning = true; // Set the running flag
    $(this).addClass("start-button-pressed");
    $(this).prop('disabled', true); // Disable the button

    let timeLeft = 30; // Initial time in seconds

    // Function to format the time in "TIME: MM:SS" format
    function formatTime(seconds) {
        let minutes = Math.floor(seconds / 60); // Calculate minutes
        let remainingSeconds = seconds % 60; // Calculate remaining seconds
        return `TIME: ${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`; // Format as "TIME: M:SS"
    }

    // Display initial formatted time
    $('.time').html(formatTime(timeLeft));

    // Function to update the time every second
    let countdown = setInterval(function() {
        timeLeft--; // Decrease time by one second
        $('.time').html(formatTime(timeLeft)); // Update the displayed time

        if (timeLeft <= 0) {
            $('.scoreboard').addClass("scoreboard-show"); 
            $("#final-score").html(score); // Display final score)
            clearInterval(countdown); // Stop the countdown when time is up
            $('.time').html('TIME: 0:00'); // Optionally display "TIME: 0:00"
            isRunning = false; // Reset the running flag
            $('.input').val(""); // Clear the input field
            $('.output').html("Press 'START' para comenzar el TuCan Translate ✨"); 
            $(".api-response").html("¡Hola! I am tu AI assistant. I’ll be helping you con hints y explicaciones en your respuestas. ¡You got this!🙌"); // Clear the output field
            $('.start-button').prop('disabled', false); // Enable the button again
            $('.start-button').removeClass("start-button-pressed"); // Reset button style
        }
    }, 1000); // Interval of 1 second (1000 milliseconds)
});

$('.final-button').click(function() { 
    $('.scoreboard').removeClass("scoreboard-show"); 
});



// Function to generate a random Spanish sentence
function randomSentence() {
    var flattenedSentences = [];
    for (var category in lvl1) {
        if (lvl1.hasOwnProperty(category)) {
            for (var phrase in lvl1[category]) {
                if (lvl1[category].hasOwnProperty(phrase)) {
                    flattenedSentences.push(lvl1[category][phrase]);
                }
            }
        }
    }

    // Generate a random index
    var randomIndex = Math.floor(Math.random() * flattenedSentences.length);

    // Access the random sentence
    var randomSentence = flattenedSentences[randomIndex];

    return randomSentence;
}

// Function to prepare the API request message
function prepareAPIRequest(userInput) {
    const { spanishSentence, englishTranslation } = getRandomSentence();
    const apiMessage = `Is "${userInput}" the English translation of "${spanishSentence}"?`;
    return apiMessage;
}
