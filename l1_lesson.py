introduction = [
    # Introduction
    "¡Hola, class! Welcome to our exciting journey to explore the English alphabet.",
    "Today marks the beginning of our exploration into Unit One, where we will be laying the foundation for our English learning adventure. ¿Están listos para aprender algo nuevo?",
    "In Unit One, we will be delving into the basics, starting with el English alphabet.",

    # Tucan will display an image of the English alphabet right now
    "Here is the English alphabet! Don't you worry, we won't get to them all today.",  # Image stops
]

letters = {
    "A": "'aye', como 'amor.' ¿Pueden decirlo conmigo? A.",
    "B": "'Bee', como 'bueno.' ¡Excelente! B.",
    "C": "'Cee', como 'casa.' Muy bien. C.",
    "D": "'Dee', como 'día.' Muy bien. D.",
    "E": "E, como 'elefante.' Maravilloso. E.",
    "F": "'Eff', como 'flor.' Fantástico. F.",
    "G": "'Gee', como 'gato.' Genial. G.",
    "H": "'Aitch', como 'hola.' Muy bien. H.",
    "I": "'Eye', como 'iglú.' Increíble. I.",
    "J": "'Jay', como 'jirafa.' Justo así. J.",
    "K": "'Kay', como 'kilo.' K, muy bien.",
    "L": "'Elle', como 'luz.' Lindo. L.",
    "M": "'Emm', como 'mariposa.' Magnífico. M.",
    "N": "'Enn', como 'nube.' N, perfecto.",
    "O": "'Oh', como 'oso.' ¡Óptimo! O.",
    "P": "'Pee', como 'pelota.' Preciso. P.",
    "Q": "'Cue', como 'queso.' ¡Qué bueno! Q.",
    "R": "'Arr', como 'ratón.' Realmente bien. R.",
    "S": "'Ess', como 'sol.' S, excelente.",
    "T": "'Tee', como 'tigre.' Tremendo. T.",
    "U": "'You', como 'uva.' Único. U.",
    "V": "'Vee', como 'vaca.' V, vamos.",
    "W": "'Double-U', como 'waffle.' Wow, fantástico. W.",
    "X": "'Ex', como 'xilófono.' ¡Xilófono! X.",
    "Y": "'Why', como 'yo-yo.' ¡Yupi! Y.",
    "Z": "'Zee', como 'zorro.' Z, excelente."
}

def click_to_continue(): 
    input()

    
def u1l1_scipt(): 
    for _ in introduction: 
        print(_)
        click_to_continue()

    for _ in letters: 
        print(_ + ": " + letters[_])
        click_to_continue()

    print("Now that you have filled your brain, lets hed over to the leaners section-- using AI!")

u1l1_scipt()