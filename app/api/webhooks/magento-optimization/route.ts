import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Webhook receiver for optimization events
// Called by auto-content-optimizer when recommendations are auto-approved
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { event, keyword, site, newTitle, newDescription } = body

    if (event !== 'optimization_applied') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    // In production, this would call Magento API to update product
    // For now, we log the event and store it in a webhook_log table
    console.log(`[Magento Webhook] Received optimization for "${keyword}" on ${site}`)
    console.log(`  New Title: ${newTitle}`)
    console.log(`  New Description: ${newDescription}`)

    // Store in database for audit trail
    await supabase.from('optimization_webhook_log').insert({
      event,
      keyword,
      site,
      new_title: newTitle,
      new_description: newDescription,
      received_at: new Date().toISOString(),
      status: 'pending_magento_update',
    })

    // TODO: Call Magento API to update product
    // const magentoResponse = await fetch(`${MAGENTO_API_URL}/products/${keyword}`, {
    //   method: 'PUT',
    //   headers: {
    //     'Authorization': `Bearer ${MAGENTO_API_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     product: {
    //       name: newTitle,
    //       meta_description: newDescription
    //     }
    //   })
    // })

    return NextResponse.json(
      { status: 'success', message: 'Webhook processed' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}
