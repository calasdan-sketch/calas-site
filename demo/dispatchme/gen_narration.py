import asyncio, json, subprocess, edge_tts
VOICE="en-CA-ClaraNeural"; OUT="narration"
LINES=[
 "Welcome to Dispatch Me. A property manager just sent in a parking lot that needs clearing. Here is their request.",
 "Cara takes it from here. She captures the address, the lot size, and exactly what they need, with no phone tag and no missed calls.",
 "Dispatch Me sizes up the lot and flags what it takes, the walkways, the salting, and the deadline before the first snowfall.",
 "Then it matches the job to the right crew nearby, chosen by their area and their equipment, from your vetted list.",
 "One tap sends the dispatch. The crew is on it, and you never had to answer a five a.m. phone call.",
 "When it is done, the crew sends photo proof with a timestamp, so you can show the property's insurer the lot was cleared.",
 "You own the contract. The machine runs the coordination. That is the whole idea, you scale without the chaos.",
 "That is the tour. Have a look around.",
]
def dur(p):
    o=subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",p])
    return round(float(o.strip()),2)
async def main():
    ds=[]
    for i,t in enumerate(LINES):
        p=f"{OUT}/step-{i}.mp3"
        await edge_tts.Communicate(t,VOICE).save(p)
        ds.append(dur(p)); print(f"step-{i}: {ds[-1]}s")
    print("DURS="+json.dumps(ds))
asyncio.run(main())
