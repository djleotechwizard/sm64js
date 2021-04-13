import sys
import librosa
import librosa.display
from os import path
import matplotlib.pyplot as plt
import numpy as np
import time

wave_file = sys.argv[1]
if not path.exists(wave_file) or not wave_file.lower().endswith('.wav'):
    print("No valid wave file! Use 'python mfcc.py <FILE>'.")

X, sample_rate = librosa.load(wave_file, sr=None, offset=0)

mfcc = librosa.feature.mfcc(y=X, sr=sample_rate)

fig, ax = plt.subplots()

img = librosa.display.specshow(mfcc, x_axis='time', ax=ax)

fig.colorbar(img, ax=ax)

ax.set(title='MFCC')

plt.show()