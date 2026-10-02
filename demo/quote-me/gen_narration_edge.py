"""Quote Me demo narration — FREE local path (edge-tts, Microsoft neural voice).

No API key, no cost. This is the cheap default; gen_narration.py (ElevenLabs
"Sarah") stays as the premium upgrade path. LINES must match index.html.

Run (cmd):  pip install edge-tts && python gen_narration_edge.py
"""
import asyncio, glob, json, os
import edge_tts

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "narration")
VOICE = "en-US-AriaNeural"  # warm, conversational female

LINES = [
    "Welcome to Quote Me. This is Tallgrass Plumbing and Heating, a made-up shop. Dave has just finished looking at a customer's furnace.",
    "Instead of writing up a quote tonight, he talks the job into his phone for about ninety seconds. What's wrong, what he'll do, and what parts it takes.",
    "Before he leaves, he snaps a photo of the old part. Quote Me keeps it with the quote, and it rides along on the supplier order, so the right part gets sent, not a guess.",
    "If he'd rather type it, that works too. Either way, one press builds the quote.",
    "Every line is priced from his own rate card. His labour rate, his parts, his markups. Not an industry average.",
    "He can change anything. The customer wants a spare filter, so one tap, and the total updates straight away.",
    "Nothing goes out until Dave ticks Reviewed. Quote Me never sends a price he hasn't looked at.",
    "This is exactly what the customer will see. A clean, itemised quote on her phone, with the job photos. No app, no account, no P D F.",
    "Press Send, and the customer gets one link by email. In this demo, nothing is actually sent.",
    "She reads it, types her name to accept, and pays the deposit from her bank account or a card, right there.",
    "Dave is told the moment it's done. The job is booked before the truck leaves the driveway.",
    "Quote Me is ninety-nine dollars a month per shop, with no setup fee. If it hasn't collected a real deposit for you in sixty days, those two months are refunded.",
    "That's the tour. Now try it yourself: pick a job or type your own, and build a quote.",
]


async def main():
    os.makedirs(OUT, exist_ok=True)
    for old in glob.glob(os.path.join(OUT, "*.mp3")):
        os.remove(old)
    for i, line in enumerate(LINES):
        await edge_tts.Communicate(line, VOICE).save(os.path.join(OUT, f"step-{i}.mp3"))
        print(f"step-{i} done")
    print("ALL DONE:", len(LINES), "clips")


if __name__ == "__main__":
    asyncio.run(main())
