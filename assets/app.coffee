`
//=require markers.js
`
form = $('#mc-embedded-subscribe-form')
email = form.find('.email')
error = $("#mce-error-response")
success = $("#mce-success-response")
emailRegex = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$', "i")


form.submit (e)->  
  email_address = email.val().trim()
  
  if email_address is '' 
    success.hide()
    error.text('Enter your email :)').show()
    e.preventDefault()
  else if not emailRegex.test(email_address)
    success.hide()
    error.text("That doesn't look like a valid email. Try again.").show()
    e.preventDefault()
  else
    error.hide()
    success.text("Thank you!").show()

email.on 'input', (e)->
  error.hide()
  success.hide()