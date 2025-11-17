# Code Execution Security

## Overview

Code execution has been hardened with multiple security layers to make it safe for production use when `ENABLE_CODE_EXECUTION=true`.

## Security Features

### 1. Rate Limiting
- **Limit**: 10 executions per user per minute
- **Tracking**: Per-user (by user ID or IP address)
- **Response**: Returns 429 (Too Many Requests) when exceeded
- **Memory**: Automatic cleanup of old rate limit entries

### 2. Input Validation

#### Code Length Limits
- Maximum 5,000 characters per execution
- Prevents resource exhaustion attacks

#### Dangerous Pattern Detection
Blocks code containing:
- **File system access**: `import os`, `import sys`, `open()`, `fs.`, etc.
- **Network access**: `import requests`, `fetch()`, `http.`, etc.
- **Process execution**: `subprocess`, `spawn()`, `exec()`, etc.
- **Code injection**: `eval()`, `exec()`, `__import__()`, `Function()`, etc.
- **Dangerous JavaScript**: `process.`, `global.`, `require('fs')`, etc.

#### Language-Specific Blocks

**Python:**
- Blocks imports: `os`, `sys`, `subprocess`, `shutil`, `pathlib`, `urllib`, `requests`, `http`, `socket`, `multiprocessing`, `threading`, `ctypes`, `pickle`

**JavaScript:**
- Blocks requires: `fs`, `child_process`, `http`, `https`, `net`, `dns`, `crypto`

### 3. Python Execution Security

#### Process Isolation
- Executes in separate child process
- No access to parent process environment
- Cleared `PYTHONPATH` environment variable
- Temporary files cleaned up immediately after execution

#### Restricted Builtins
- Only safe builtin functions available: `print`, `len`, `str`, `int`, `float`, `bool`, `list`, `dict`, `tuple`, `set`, `range`, `enumerate`, `zip`, `min`, `max`, `sum`, `abs`, `round`, `sorted`, `reversed`, `type`, `isinstance`, `hasattr`, `getattr`
- Dangerous builtins blocked: `__import__`, `eval`, `exec`, `compile`, `open`, `file`, `input`

#### Resource Limits
- **Timeout**: 3 seconds (reduced from 5)
- **Max Output**: 512KB stdout/stderr
- **Process**: Killed immediately on timeout or output limit

### 4. JavaScript Execution Security

#### VM Sandbox
- Uses Node.js `vm` module with strict context isolation
- No access to Node.js internals (`process`, `require`, `global`, etc.)
- Code generation disabled (no `eval`-like operations)
- WebAssembly disabled

#### Restricted Context
Only safe APIs available:
- `console.log()` - for output
- `Math.*` - math functions
- `String`, `Number`, `Boolean`, `Array`, `Object`, `Date`, `JSON`
- `parseInt`, `parseFloat`, `isNaN`, `isFinite`

#### Resource Limits
- **Timeout**: 3 seconds
- **Max Output**: 10KB (truncated if exceeded)
- **Stack Overflow**: Detected and reported

### 5. Error Handling

#### Sanitized Error Messages
- Internal error details not exposed to users
- Generic messages for timeouts and failures
- Prevents information leakage

#### Safe Error Responses
- All errors caught and handled gracefully
- No stack traces exposed
- Consistent error format

## Security Best Practices

### For Production

1. **Monitor Usage**
   - Watch for rate limit violations
   - Monitor execution times
   - Check for suspicious patterns

2. **Regular Updates**
   - Keep Node.js and Python updated
   - Review and update dangerous pattern list
   - Monitor security advisories

3. **Logging**
   - Log all code execution attempts
   - Track failures and timeouts
   - Monitor for abuse patterns

4. **Consider Alternatives**
   - For maximum security, use Docker-based sandboxing
   - Consider external services (Judge0, Piston API)
   - Use separate isolated execution service

### Configuration

Set in environment variables:
```bash
ENABLE_CODE_EXECUTION=true  # Enable code execution
```

To disable (recommended for production):
```bash
ENABLE_CODE_EXECUTION=false
```

## Limitations

### Current Security Model

⚠️ **Important**: While significantly hardened, this is NOT a perfect sandbox:

1. **Python**: Runs in separate process but on same system
   - Could potentially access system resources if Python interpreter has vulnerabilities
   - No CPU/memory limits enforced at OS level

2. **JavaScript**: Uses Node.js VM which has known escape vectors
   - Some edge cases may allow access to Node.js internals
   - Not as secure as true containerization

### Recommended for Production

For production use with untrusted users:
- ✅ **Acceptable**: Educational platforms, internal tools, trusted users
- ⚠️ **Risky**: Public-facing with untrusted users
- ❌ **Not Recommended**: High-security environments, financial systems

### For Maximum Security

Consider:
1. **Docker Containers**: Isolate each execution in a container
2. **External Services**: Use Judge0 API or Piston API
3. **Separate Service**: Run code execution on isolated server
4. **Resource Limits**: Use cgroups or similar for CPU/memory limits

## Testing

Test the security with these examples (should all be blocked):

```python
# Should be blocked
import os
os.system("rm -rf /")

import subprocess
subprocess.call(["ls", "-la"])

eval("print('hacked')")
```

```javascript
// Should be blocked
require('fs').readFileSync('/etc/passwd')
process.exit(1)
global.process
```

## Support

If you discover security vulnerabilities:
1. Do NOT disclose publicly
2. Report to maintainers
3. Follow responsible disclosure practices

