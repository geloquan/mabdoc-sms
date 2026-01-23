package com.mabdocsms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    private val TAG = "BootReceiver"
    
    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "BootReceiver triggered with action: ${intent.action}")
        
        // Handle multiple boot-related intents for better compatibility
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            Intent.ACTION_LOCKED_BOOT_COMPLETED,
            "android.intent.action.REBOOT" -> {
                Log.d(TAG, "Starting MainActivity after boot")
                
                try {
                    val mainActivityIntent = Intent(context, MainActivity::class.java).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                        addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                    }
                    context.startActivity(mainActivityIntent)
                    Log.d(TAG, "MainActivity started successfully")
                } catch (e: Exception) {
                    Log.e(TAG, "Error starting MainActivity: ${e.message}", e)
                }
            }
            else -> {
                Log.d(TAG, "Unhandled intent action: ${intent.action}")
            }
        }
    }
}
