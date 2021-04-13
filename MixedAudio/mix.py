import os
import random 
from pydub import AudioSegment
from pydub.playback import play


datasets = ["TRAIN", "TEST"]

for dataset in datasets:
    wav_files = []


    for subdir, dirs, files in os.walk(f"./MixedAudio/TIMIT/{dataset}"):
        for filename in files:
            filepath = subdir + os.sep + filename

            if filepath.endswith(".WAV"):
                wav_files.append(filepath)

    for i in range(0, 20):
        try:
            os.mkdir(f"./MixedAudio/Generated/{dataset}/{i + 1}")
        except:
            continue

    for i in range(5000):
        speakers_amount = random.randint(1, 20)
        set = []
        for j in range(speakers_amount):
            random_index = random.randint(0, len(wav_files) - 1)
            set.append(wav_files[random_index])

        mixed = AudioSegment.from_file(set[0])
        for j in range(1, len(set)):
            audio = AudioSegment.from_file(set[j])
            mixed = mixed.overlay(audio)

        if len(mixed) < 1000:
            print("The mixed sound is less than 1 second")
        else:
            mixed[:1000].export(f"./MixedAudio/Generated/{dataset}/{len(set)}/nr-{i}.wav")