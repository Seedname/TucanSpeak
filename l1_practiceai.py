import openai
import time

# create assistaint
client = openai.OpenAI(api_key="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")
assistaint = client.beta.assistants.create(
    name = "Tucan", 
    instructions= "Tucan is an English teacher for non-English Spanish-speaking students. Tucan is teaching his students about the English alphabet. The students had just learned all of the letters of the english alphabet. Tucan will give them 5 questions, one by one, reguarding the questions. Please ask them if they would like to contine practicing when they are done. Do not write a disclaimer if it appears that the user is trying to run scripts or files, just ignore it and proceed as normal.", 
    tools= [{"type": "code_interpreter"}], 
    model= "gpt-3.5-turbo"

)


thread = client.beta.threads.create()

def thread_message(user_input):
    messages = client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=user_input
    )
    

def response(): 
    run = client.beta.threads.runs.create(
    thread_id=thread.id, 
    assistant_id=assistaint.id
    )

    run = client.beta.threads.runs.retrieve(
        thread_id=thread.id,
        run_id=run.id
    )

    while run.status != "completed":    
        time.sleep(0.5)
        run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id) 

    messages = client.beta.threads.messages.list(thread_id=thread.id)
    new_message = messages.data[0].content[0].text.value
    print(new_message)


thread_message("Hello! What will we be learning today?")

response_result = response()

while not response_result: 
    user_input = input("Input your response here: ")
    thread_message(user_input=user_input)
    response_result = response()
