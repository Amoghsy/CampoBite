package com.anonymous.campobite_mobile_app

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import com.facebook.react.bridge.*
import java.util.*

class SpeechModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var speechRecognizer: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null

    override fun getName(): String = "SpeechModule"

    init {
        // TTS is safe to initialize here
        tts = TextToSpeech(reactContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale.US
            }
        }
    }

    @ReactMethod
    fun startListening(promise: Promise) {

        Handler(Looper.getMainLooper()).post {

            if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
                promise.reject("NOT_AVAILABLE", "Speech recognition not available")
                return@post
            }

            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
            intent.putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
            )
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())

            speechRecognizer?.setRecognitionListener(object : RecognitionListener {

                override fun onResults(results: Bundle?) {
                    val matches = results?.getStringArrayList(
                        SpeechRecognizer.RESULTS_RECOGNITION
                    )

                    if (!matches.isNullOrEmpty()) {
                        promise.resolve(matches[0])
                    } else {
                        promise.reject("NO_MATCH", "No speech recognized")
                    }

                    speechRecognizer?.destroy()
                    speechRecognizer = null
                }

                override fun onError(error: Int) {
                    promise.reject("ERROR", "Speech recognition error: $error")
                    speechRecognizer?.destroy()
                    speechRecognizer = null
                }

                override fun onReadyForSpeech(params: Bundle?) {}
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}
                override fun onPartialResults(partialResults: Bundle?) {}
                override fun onEvent(eventType: Int, params: Bundle?) {}
            })

            speechRecognizer?.startListening(intent)
        }
    }

    @ReactMethod
    fun stopListening() {
        Handler(Looper.getMainLooper()).post {
            speechRecognizer?.stopListening()
            speechRecognizer?.destroy()
            speechRecognizer = null
        }
    }

    @ReactMethod
    fun speak(text: String) {
        Handler(Looper.getMainLooper()).post {
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
        }
    }

    override fun invalidate() {
        speechRecognizer?.destroy()
        tts?.shutdown()
        super.invalidate()
    }
}