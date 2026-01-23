package com.mabdocsms

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "mabdocSMS"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Request battery optimization exemption and other critical permissions for 24/7 operation
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Request battery optimization exemption for 24/7 operation
    requestBatteryOptimizationExemption()
  }

  private fun requestBatteryOptimizationExemption() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val packageName = packageName
      val pm = getSystemService(POWER_SERVICE) as PowerManager
      
      // Check if already exempted from battery optimization
      if (!pm.isIgnoringBatteryOptimizations(packageName)) {
        try {
          // Request to be exempted from battery optimization
          val intent = Intent()
          intent.action = Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
          intent.data = Uri.parse("package:$packageName")
          startActivity(intent)
        } catch (e: Exception) {
          // If the specific intent fails, open the general battery optimization settings
          try {
            val intent = Intent()
            intent.action = Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS
            startActivity(intent)
          } catch (ex: Exception) {
            ex.printStackTrace()
          }
        }
      }
    }
  }
}
