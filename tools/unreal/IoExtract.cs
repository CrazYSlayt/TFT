// Dateien aus einer unverschlüsselten Unreal-IoStore-Datei (.utoc/.ucas) roh entpacken (Oodle über die DLL, die FModel mitbringt).
// Nur lesen. Aufruf aus PowerShell: [IoExtract]::Run(utoc, muster, zielordner, oodleDll)
using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;

public static class IoExtract
{
    [DllImport("kernel32", SetLastError = true, CharSet = CharSet.Unicode)] static extern IntPtr LoadLibrary(string path);
    [DllImport("kernel32", CharSet = CharSet.Ansi)] static extern IntPtr GetProcAddress(IntPtr mod, string name);
    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    delegate long OodleDecompress(byte[] comp, long compSize, byte[] raw, long rawSize, int fuzz, int crc, int verbose, IntPtr decBuf, long decBufSize, IntPtr cb, IntPtr cbUser, IntPtr mem, long memSize, int phase);
    static OodleDecompress oodle;

    static long BE40(byte[] b, int o) { long v = 0; for (int i = 0; i < 5; i++) v = (v << 8) | b[o + i]; return v; }
    static long LE40(byte[] b, int o) { long v = 0; for (int i = 4; i >= 0; i--) v = (v << 8) | b[o + i]; return v; }
    static int LE24(byte[] b, int o) { return b[o] | (b[o + 1] << 8) | (b[o + 2] << 16); }

    public static string Run(string utoc, string pattern, string outDir, string oodleDll)
    {
        var log = new StringBuilder();
        IntPtr mod = LoadLibrary(oodleDll);
        if (mod == IntPtr.Zero) return "Oodle-DLL nicht ladbar: " + Marshal.GetLastWin32Error();
        IntPtr fn = GetProcAddress(mod, "OodleLZ_Decompress");
        if (fn == IntPtr.Zero) return "OodleLZ_Decompress nicht gefunden";
        oodle = (OodleDecompress)Marshal.GetDelegateForFunctionPointer(fn, typeof(OodleDecompress));

        byte[] b = File.ReadAllBytes(utoc);
        int hdr = BitConverter.ToInt32(b, 20), n = BitConverter.ToInt32(b, 24), cbN = BitConverter.ToInt32(b, 28), cbS = BitConverter.ToInt32(b, 32);
        int cmN = BitConverter.ToInt32(b, 36), cmL = BitConverter.ToInt32(b, 40), blockSize = BitConverter.ToInt32(b, 44), dirSize = BitConverter.ToInt32(b, 48);
        int flags = b[80], seeds = BitConverter.ToInt32(b, 84), noPh = BitConverter.ToInt32(b, 96);
        int oIds = hdr, oOL = oIds + n * 12, oCB = oOL + n * 10 + seeds * 4 + noPh * 4, oCM = oCB + cbN * cbS, oDir = oCM + cmN * cmL;
        var methods = new List<string> { "None" };
        for (int i = 0; i < cmN; i++) methods.Add(Encoding.ASCII.GetString(b, oCM + i * cmL, cmL).TrimEnd('\0'));
        log.AppendLine("Methoden: " + string.Join(",", methods.ToArray()));

        // Directory Index: Pfad -> TocEntryIndex
        int p = oDir;
        Func<int> i32 = () => { int v = BitConverter.ToInt32(b, p); p += 4; return v; };
        Func<string> fstr = () => { int len = i32(); if (len == 0) return ""; string s; if (len < 0) { s = Encoding.Unicode.GetString(b, p, -len * 2 - 2); p += -len * 2; } else { s = Encoding.ASCII.GetString(b, p, len - 1); p += len; } return s; };
        string mount = fstr();
        int dn = i32(); var dirs = new uint[dn, 4]; for (int i = 0; i < dn; i++) for (int k = 0; k < 4; k++) dirs[i, k] = (uint)i32();
        int fnn = i32(); var files = new uint[fnn, 3]; for (int i = 0; i < fnn; i++) for (int k = 0; k < 3; k++) files[i, k] = (uint)i32();
        int sn = i32(); var strs = new string[sn]; for (int i = 0; i < sn; i++) strs[i] = fstr();
        var list = new List<KeyValuePair<string, uint>>();
        var stack = new Stack<KeyValuePair<uint, string>>(); stack.Push(new KeyValuePair<uint, string>(0, mount));
        while (stack.Count > 0)
        {
            var cur = stack.Pop(); uint d = cur.Key; string path = cur.Value;
            for (uint f = dirs[d, 3]; f != uint.MaxValue; f = files[f, 1]) list.Add(new KeyValuePair<string, uint>(path + strs[files[f, 0]], files[f, 2]));
            for (uint c = dirs[d, 1]; c != uint.MaxValue; c = dirs[c, 2]) stack.Push(new KeyValuePair<uint, string>(c, path + strs[dirs[c, 0]] + "/"));
        }

        var re = new Regex(pattern, RegexOptions.IgnoreCase);
        string ucas = Path.ChangeExtension(utoc, ".ucas");
        using (var fs = new FileStream(ucas, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
        {
            foreach (var e in list)
            {
                if (!re.IsMatch(e.Key)) continue;
                int idx = (int)e.Value;
                long off = BE40(b, oOL + idx * 10), len = BE40(b, oOL + idx * 10 + 5);
                var ms = new MemoryStream();
                long first = off / blockSize, last = (off + len - 1) / blockSize;
                for (long bi = first; bi <= last; bi++)
                {
                    int eo = oCB + (int)bi * cbS;
                    long bOff = LE40(b, eo); int cSize = LE24(b, eo + 5), uSize = LE24(b, eo + 8), m = b[eo + 11];
                    byte[] comp = new byte[cSize]; fs.Position = bOff; fs.Read(comp, 0, cSize);
                    byte[] raw;
                    if (m == 0) raw = comp;
                    else
                    {
                        raw = new byte[uSize];
                        long got = oodle(comp, cSize, raw, uSize, 1, 0, 0, IntPtr.Zero, 0, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero, 0, 3);
                        if (got != uSize) { log.AppendLine("Oodle-Fehler bei " + e.Key + " Block " + bi + ": " + got); raw = new byte[uSize]; }
                    }
                    long from = bi == first ? off - first * blockSize : 0;
                    long to = bi == last ? off + len - bi * blockSize : uSize;
                    ms.Write(raw, (int)from, (int)(to - from));
                }
                string rel = e.Key.Replace("../", "").Replace('/', Path.DirectorySeparatorChar);
                string dest = Path.Combine(outDir, rel);
                Directory.CreateDirectory(Path.GetDirectoryName(dest));
                File.WriteAllBytes(dest, ms.ToArray());
                log.AppendLine(rel + " (" + ms.Length + " Bytes, Chunk-Typ " + b[oIds + idx * 12 + 11] + ")");
            }
        }
        return log.ToString();
    }
}
