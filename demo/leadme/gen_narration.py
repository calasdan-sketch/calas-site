import asyncio, json, subprocess, edge_tts
VOICE="en-US-GuyNeural"; OUT="narration"
LINES=[
 "Welcome to Lead Me. This is your territory — real businesses, found for free. Press Find leads and it starts searching.",
 "Here they come. Each company is scored out of a hundred for how good a fit it is, warmest first.",
 "Click any company to see what Lead Me learned — straight from their own website, with the source shown.",
 "Here's the first email, already drafted from those facts. No guessed names, nothing spammy — just true and to the point.",
 "You're always in control. Nothing sends until you approve it, and the daily cap and unsubscribe are built right in.",
 "When someone replies, Lead Me reads it and stops the follow-ups automatically, so nobody gets pestered.",
 "That's the whole job — the right businesses found, warmed up, and handed to you ready to call.",
 "That's the tour. Have a look around.",
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
